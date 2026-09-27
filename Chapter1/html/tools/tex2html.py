#!/usr/bin/env python3
"""把 Beamer 课件 pdf/CF_ChapterN.tex 转成 HTML 课件 html/CF_ChapterN.html（N 取自所在的章节文件夹）。

用法（在任意目录运行）：
    python tex2html.py

规则：一个 frame 对应一页；页码与 PDF 页脚一致。<2-> 这类分步显示转成“按一次再出现”。
公式原样交给 KaTeX 渲染（行内公式与课件一样按 \\displaystyle 排版）。
demos_config.py 列出在哪些页放“交互演示”按钮；修改 tex 后重新运行即可。
"""
import html
import pathlib
import re
import shutil
import sys

HERE = pathlib.Path(__file__).resolve().parent
HTML_DIR = HERE.parent
CHAPTER = HTML_DIR.parent.name                      # 例如 Chapter1
TEX = HTML_DIR.parent / 'pdf' / ('CF_%s.tex' % CHAPTER)
OUT = HTML_DIR / ('CF_%s.html' % CHAPTER)
FIG_SRC = HTML_DIR.parent / 'pdf'
FIG_DST = HTML_DIR / 'figures'
TEXT_HEIGHT = 560   # 幻灯片正文区高度（px），用于换算 height=0.6\textheight

# 每章自己的配置：演示入口 DEMOS、插图尺寸 FIG_HEIGHT（见同目录 demos_config.py）
sys.path.insert(0, str(HERE))
from demos_config import DEMOS, FIG_HEIGHT  # noqa: E402

MATH_ENVS = ('align*', 'align', 'equation*', 'equation', 'gather*', 'gather', 'multline*')
BLOCKS = {'definition': ('Definition', None, 'def'), 'example': ('Example', 'example', 'ex'),
          'theorem': ('Theorem', 'theorem', 'def'), 'property': ('Property', 'property', 'def')}


# ---------------------------------------------------------------- 基础工具
def match_brace(s, i):
    """s[i] == '{'，返回与之匹配的 '}' 的下标。"""
    depth = 0
    j = i
    while j < len(s):
        c = s[j]
        if c == '\\':
            j += 2
            continue
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return j
        j += 1
    raise ValueError('unbalanced braces near: ' + s[i:i + 60])


def read_group(s, i):
    """跳过空白后读取 {...}，返回 (内容, 结束后的下标)。"""
    while i < len(s) and s[i] in ' \t\n':
        i += 1
    if i >= len(s) or s[i] != '{':
        return None, i
    j = match_brace(s, i)
    return s[i + 1:j], j + 1


def read_opt(s, i):
    """读取可选的 <...> 与 [...]，返回 (overlay, opt, 新下标)。"""
    overlay = opt = None
    while True:
        k = i
        while k < len(s) and s[k] in ' \t':
            k += 1
        if k < len(s) and s[k] == '<':
            e = s.index('>', k)
            overlay, i = s[k + 1:e], e + 1
        elif k < len(s) and s[k] == '[':
            depth, e = 0, k
            while e < len(s):
                if s[e] == '[':
                    depth += 1
                elif s[e] == ']':
                    depth -= 1
                    if depth == 0:
                        break
                e += 1
            opt, i = s[k + 1:e], e + 1
        else:
            return overlay, opt, i


def strip_comments(tex):
    return '\n'.join(re.sub(r'(?<!\\)%.*', '', line) for line in tex.split('\n'))


def unwrap(s, name, nargs_drop):
    """\\name{a}{b}{X} → X（丢掉前 nargs_drop 个参数）。"""
    pat = re.compile(r'\\' + re.escape(name) + r'\*?(?![A-Za-z])')
    while True:
        m = pat.search(s)
        if not m:
            return s
        i = m.end()
        for _ in range(nargs_drop):
            _, i = read_group(s, i)
        body, e = read_group(s, i)
        s = s[:m.start()] + (body or '') + s[e:]


# ---------------------------------------------------------------- 公式
def find_env_end(s, name, start):
    b, e = '\\begin{%s}' % name, '\\end{%s}' % name
    depth, i = 1, start
    while depth:
        nb, ne = s.find(b, i), s.find(e, i)
        if ne < 0:
            raise ValueError('missing ' + e)
        if 0 <= nb < ne:
            depth, i = depth + 1, nb + len(b)
        else:
            depth, i = depth - 1, ne + len(e)
    return i - len(e), i


TAG = re.compile(r'\\tag\{((?:[^{}]|\{[^{}]*\})*)\}')


def math_display(body):
    body = unwrap(body, 'resizebox', 2).replace('$', '')
    tags = TAG.findall(body)
    if len(tags) > 1 or (tags and re.search(r'\\\\', body) and not re.search(r'\\begin\{', body)):
        body = TAG.sub('', body)
        body = '\\begin{aligned}' + body + '\\end{aligned}' + ('\\tag{%s}' % tags[-1])
    return '\\[' + body.strip() + '\\]'


def protect_math(s, store):
    out, i = [], 0

    def keep(tex):
        store.append(tex)
        return '\x00%d\x00' % (len(store) - 1)

    while i < len(s):
        if s.startswith('\\$', i):
            out.append('$')
            i += 2
        elif s.startswith('$$', i):
            j = s.index('$$', i + 2)
            out.append(keep(math_display(s[i + 2:j])))
            i = j + 2
        elif s.startswith('\\[', i):
            j = s.index('\\]', i + 2)
            out.append(keep(math_display(s[i + 2:j])))
            i = j + 2
        elif s.startswith('\\(', i):
            j = s.index('\\)', i + 2)
            out.append(keep('$\\displaystyle ' + s[i + 2:j] + '$'))
            i = j + 2
        elif s.startswith('\\begin{', i) and s[i + 7:s.find('}', i)] in MATH_ENVS:
            name = s[i + 7:s.find('}', i)]
            a = s.find('}', i) + 1
            e0, e1 = find_env_end(s, name, a)
            body = s[a:e0]
            tags = TAG.findall(body)
            body = TAG.sub('', body).replace('\\notag', '')
            if name.startswith(('align', 'gather')):
                body = '\\begin{%s}%s\\end{%s}' % ('aligned' if name.startswith('align') else 'gathered', body, 'aligned' if name.startswith('align') else 'gathered')
            tex = '\\[' + body.strip() + ('\\tag{%s}' % tags[-1] if tags else '') + '\\]'
            out.append(keep(tex))
            i = e1
        elif s[i] == '$':
            j = i + 1
            while s[j] != '$' or s[j - 1] == '\\':
                j += 1
            out.append(keep('$\\displaystyle ' + s[i + 1:j] + '$'))
            i = j + 1
        else:
            out.append(s[i])
            i += 1
    return ''.join(out)


# ---------------------------------------------------------------- 文字
def group_cmd(s, cmd, open_tag, close_tag):
    """{\\bf X} 形式的命令。"""
    while True:
        m = re.search(r'\{\\' + cmd + r'(?![A-Za-z])\s*', s)
        if not m:
            return s
        e = match_brace(s, m.start())
        s = s[:m.start()] + open_tag + s[m.end():e] + close_tag + s[e + 1:]


def arg_cmd(s, cmd, open_tag, close_tag):
    while True:
        m = re.search(r'\\' + cmd + r'(?![A-Za-z])', s)
        if not m:
            return s
        body, e = read_group(s, m.end())
        if body is None:
            s = s[:m.start()] + s[m.end():]
            continue
        s = s[:m.start()] + open_tag + body + close_tag + s[e:]


def inline(s):
    s = s.replace('\\underline{\\makebox[50pt]{}}', '\x01BLANK\x01')
    s = html.escape(s, quote=False)
    s = group_cmd(s, 'bf', '<b>', '</b>')
    s = group_cmd(s, 'it', '<i>', '</i>')
    for c in ('textbf',):
        s = arg_cmd(s, c, '<b>', '</b>')
    for c in ('emph', 'textit'):
        s = arg_cmd(s, c, '<em>', '</em>')
    for c in ('textnormal', 'mbox', 'text'):
        s = arg_cmd(s, c, '', '')
    s = s.replace('\\proofname', 'Proof')
    s = re.sub(r'\\\\(\[[^\]]*\])?', '<br>', s)
    s = re.sub(r'\\(centering|hfill|noindent|par|medskip|bigskip|smallskip|justifying)(?![A-Za-z])', '', s)
    s = s.replace('\\ ', ' ').replace('~', '&nbsp;').replace('\\quad', '&emsp;')
    s = s.replace('{', '').replace('}', '')
    s = s.replace('\x01BLANK\x01', '<span class="blank"></span>')
    s = re.sub(r'[ \t]*\n[ \t]*', '\n', s)
    return s


def paragraphs(s):
    parts = [p.strip() for p in re.split(r'\n\s*\n', s)]
    out = []
    for p in parts:
        if not p:
            continue
        p = re.sub(r'\s*\n\s*', ' ', p)
        p = re.sub(r'^(<br>\s*)+|(\s*<br>)+$', '', p)
        if p:
            out.append('<p>%s</p>' % p)
    return '\n'.join(out)


# ---------------------------------------------------------------- 环境
class Ctx:
    def __init__(self):
        self.section = 0
        self.counters = {}

    def number(self, kind):
        key = (kind, self.section)
        self.counters[key] = self.counters.get(key, 0) + 1
        return '%d.%d' % (self.section, self.counters[key])


def split_items(body):
    """在最外层按 \\item 切分；返回 (起始编号偏移, [(label, text), ...])。"""
    start = 0
    m = re.search(r'\\setcounter\{enum[iv]+\}\{(\d+)\}', body)
    if m and m.start() < (body.find('\\item') if '\\item' in body else len(body)):
        start = int(m.group(1))
        body = body[:m.start()] + body[m.end():]   # 只去掉本层的 \setcounter，嵌套列表的留给它们自己
    items, depth, i, cur = [], 0, 0, None
    while i < len(body):
        if body.startswith('\\begin{', i):
            depth += 1
        elif body.startswith('\\end{', i):
            depth -= 1
        elif depth == 0 and re.match(r'\\item(?![A-Za-z])', body[i:]):
            if cur is not None:
                items.append(cur)
            j = i + 5
            _, opt, j = read_opt(body, j)
            cur = [opt, j, None]
            i = j
            continue
        i += 1
        if cur is not None:
            cur[2] = i
    if cur is not None:
        cur[2] = len(body)
        items.append(cur)
    return start, [(o, body[a:b]) for o, a, b in items]


def conv(s, ctx, level=0):
    """转换一段文字（公式已被占位）。"""
    out, i = [], 0
    pat = re.compile(r'\\begin\{([A-Za-z*]+)\}')
    while True:
        m = pat.search(s, i)
        if not m:
            out.append(paragraphs(inline(s[i:])))
            break
        out.append(paragraphs(inline(s[i:m.start()])))
        name = m.group(1)
        overlay, opt, a = read_opt(s, m.end())
        e0, e1 = find_env_end(s, name, a)
        body = s[a:e0]
        out.append(env(name, overlay, opt, body, ctx, level))
        i = e1
    return '\n'.join(x for x in out if x)


def title_text(t):
    t = inline(t).replace('\n', ' ').strip()
    t = re.sub(r'^Solution\.\s*\(Cont\.\)', 'Solution (Cont.)', t)
    t = re.sub(r'^Proof\.?\s*\(Cont\.\)', 'Proof (Cont.)', t)
    return t


def overlays(s):
    """\\uncover<2->{X}、\\visible<2->{X} → 分步显示的块。"""
    pat = re.compile(r'\\(uncover|visible|onslide)<([^>]*)>')
    while True:
        m = pat.search(s)
        if not m:
            return s
        body, e = read_group(s, m.end())
        if body is None:
            s = s[:m.start()] + s[m.end():]
            continue
        s = s[:m.start()] + '\\begin{stepblock}<%s>' % m.group(2) + body + '\\end{stepblock}' + s[e:]


def label_format(opt):
    """enumerate 的可选参数，如 (1)、1)、a)、1.、(i)；返回 n → 编号文字 的函数。无参数时返回 None（用圆形编号）。"""
    if opt is None or not opt.strip():
        return None
    o = opt.strip()
    m = re.search(r'[1aAiI]', o)
    if not m:
        return None
    pre, key, suf = o[:m.start()], m.group(0), o[m.end():]

    def roman(n):
        out, vals = '', [(10, 'x'), (9, 'ix'), (5, 'v'), (4, 'iv'), (1, 'i')]
        for v, r in vals:
            while n >= v:
                out, n = out + r, n - v
        return out
    conv_ = {'1': str, 'a': lambda n: chr(96 + n), 'A': lambda n: chr(64 + n),
             'i': roman, 'I': lambda n: roman(n).upper()}[key]
    return lambda n: pre + conv_(n) + suf


def env(name, overlay, opt, body, ctx, level):
    step = ' step' if overlay and re.match(r'\d+-', overlay) and not overlay.startswith('1') else ''
    if name in ('enumerate', 'itemize'):
        start, items = split_items(body)
        fmt = label_format(opt)
        tag = 'ol' if name == 'enumerate' else 'ul'
        lis = []
        n = start
        for label, text in items:
            inner = conv(text, ctx, level + 1)
            if label is not None and label.strip() == '':
                lis.append('<li class="nomark">%s</li>' % inner)
                continue
            if label is not None:          # \item[(4)] 这类自定义编号：原样显示，不计数
                lis.append('<li><span class="mk paren">%s</span><div>%s</div></li>' % (inline(label), inner))
                continue
            n += 1
            if name == 'itemize':
                lis.append('<li><span class="mk tri"></span><div>%s</div></li>' % inner)
            elif fmt:
                lis.append('<li><span class="mk paren">%s</span><div>%s</div></li>' % (fmt(n), inner))
            else:
                lis.append('<li><span class="mk">%d</span><div>%s</div></li>' % (n, inner))
        return '<%s class="lst%s">%s</%s>' % (tag, step, '\n'.join(lis), tag)
    if name in BLOCKS:
        base, kind, cls = BLOCKS[name]
        t = base + (' ' + ctx.number(kind) if kind else '')
        if opt:
            t += ' (%s)' % title_text(opt)
        return '<div class="blk %s%s"><div class="t">%s</div><div class="c">%s</div></div>' % (cls, step, t, conv(body, ctx, level))
    if name in ('solution', 'proofs', 'proof'):
        default = 'Solution.' if name == 'solution' else 'Proof.'
        t = title_text(opt) if opt else default
        qed = ' qed' if name == 'proof' else ''
        return '<div class="sol%s%s"><span class="t">%s</span>%s</div>' % (qed, step, t, conv(body, ctx, level))
    if name == 'figure':
        imgs = re.findall(r'\\includegraphics(?:\[([^\]]*)\])?\{([^}]*)\}', body)
        cap, _ = read_group(body, body.find('\\caption') + 8) if '\\caption' in body else (None, 0)
        tags = []
        for o, f in imgs:
            style = []
            o = o or ''
            mh = re.search(r'height=([\d.]*)\\textheight', o)
            mw = re.search(r'width=([\d.]*)\\(?:line|text)width', o)
            name_ = f if '.' in f else f + '.jpg'
            if name_ in FIG_HEIGHT:
                style.append('max-height:%dpx' % FIG_HEIGHT[name_])
            elif mh:
                style.append('max-height:%dpx' % round(float(mh.group(1) or 1) * TEXT_HEIGHT))
            else:
                style.append('max-height:%dpx' % (TEXT_HEIGHT - 80))
            if mw and len(imgs) == 1:
                style.append('max-width:%d%%' % round(float(mw.group(1) or 1) * 100))
            name_ = f if '.' in f else f + '.jpg'
            tags.append('<img src="figures/%s" alt="%s" style="%s">' % (name_, 'Figure ' + (cap or name_), ';'.join(style)))
        row = '<div class="imgrow">%s</div>' % ''.join(tags) if len(tags) > 1 else ''.join(tags)
        capt = '<figcaption><b>Figure:</b> %s</figcaption>' % inline(cap) if cap else ''
        return '<figure>%s%s</figure>' % (row, capt)
    if name == 'stepblock':
        return '<div class="%s">%s</div>' % (step.strip() or 'blockstep', conv(body, ctx, level))
    if name == 'center':
        return '<div class="center">%s</div>' % conv(body, ctx, level)
    return conv(body, ctx, level)


# ---------------------------------------------------------------- 主流程
def restore(s, store):
    return re.sub('\x00(\\d+)\x00', lambda m: html.escape(store[int(m.group(1))], quote=False), s)


def main():
    tex = strip_comments(TEX.read_text(encoding='utf-8'))
    title, _ = read_group(tex, tex.index('\\title') + 6)
    author, _ = read_group(tex, tex.index('\\author') + 7)
    inst, _ = read_group(tex, tex.index('\\institute') + 10)
    doc = tex[tex.index('\\begin{document}'):tex.index('\\end{document}')]
    doc = unwrap(doc, 'resizebox', 2)
    doc = re.sub(r'\\begin\{minipage\}(\[[^\]]*\])?\{[^}]*\}|\\end\{minipage\}', '', doc)
    doc = doc.replace('\\everymath{\\displaystyle}', '')

    sections = re.findall(r'\\section\{([^}]*)\}', doc)
    chapter_short = re.sub(r'\s*\\\\\s*', ' ', title)
    ctx = Ctx()
    slides = []
    used = set()
    for m in re.finditer(r'\\section\{([^}]*)\}|\\begin\{frame\}(.*?)\\end\{frame\}', doc, re.S):
        if m.group(1) is not None:
            ctx.section += 1
            continue
        raw = m.group(2)
        sec = sections[ctx.section - 1] if ctx.section else ''
        attrs = ' data-section="%s"' % html.escape('%d %s' % (ctx.section, sec)) if ctx.section else ''
        if '\\titlepage' in raw:
            slides.append('<section class="slide title-slide"><div class="tbox"><h1>%s</h1></div><p class="au">%s</p><p class="in">%s</p></section>'
                          % (inline(title).replace('\n', ' '), inline(author), inline(inst)))
            continue
        ft = ''
        mt = re.search(r'\\frametitle', raw)
        if mt:
            t, e = read_group(raw, mt.end())
            ft = t
            raw_body = raw[:mt.start()] + raw[e:]
        else:
            raw_body = raw
        if '\\tableofcontents' in raw_body:
            cur = ctx.section if 'currentsection' in raw_body else 0
            lis = ''.join('<li class="%s"><a href="#" data-goto-section="%d"><span class="n">%d</span>%s</a></li>' % ('cur' if k + 1 == cur else ('all' if not cur else ''), k + 1, k + 1, inline(n))
                          for k, n in enumerate(sections))
            slides.append('<section class="slide"%s><div class="ft">%s</div><div class="body"><ol class="toc">%s</ol></div></section>'
                          % (attrs, inline(ft or 'Outline'), lis))
            continue
        store = []
        body = overlays(protect_math(raw_body, store))
        body_html = restore(conv(body, ctx), store)
        demo = ''
        for k, d in enumerate(DEMOS):
            if k not in used and re.search(d['match'], raw):
                used.add(k)
                demo += '<button class="demo-btn corner" type="button" data-demo="%s" data-title="%s"><span class="ic">▶</span>%s</button>' % (
                    html.escape(d['src']), html.escape(d['label']), html.escape(d['label']))
        ft_html = '<div class="ft">%s</div>' % restore(inline(protect_math(ft, store)), store) if ft else ''
        slides.append('<section class="slide"%s>%s<div class="body">%s</div>%s</section>' % (attrs, ft_html, body_html, demo))

    missing = [d['label'] for k, d in enumerate(DEMOS) if k not in used]
    page = TEMPLATE.replace('{{CHAPTER}}', html.escape(chapter_short)).replace('{{SLIDES}}', '\n\n'.join(slides))
    page = page.replace('{{TITLE}}', html.escape(chapter_short))
    OUT.write_text(page, encoding='utf-8')
    FIG_DST.mkdir(exist_ok=True)
    for f in FIG_SRC.glob('Figure_*.jpg'):
        dst = FIG_DST / f.name
        if not dst.exists() or dst.stat().st_mtime < f.stat().st_mtime:
            shutil.copy2(f, dst)
    print('已生成 %s：%d 页' % (OUT.name, len(slides)))
    if missing:
        print('以下演示入口没有找到对应的页：', '、'.join(missing))


TEMPLATE = '''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TITLE}}</title>
<link rel="stylesheet" href="demos/assets/katex/katex.min.css">
<link rel="stylesheet" href="demos/assets/slides.css">
</head>
<body>
<!-- 本文件由 tools/tex2html.py 从 pdf/CF_Chapter1.tex 自动生成。请修改 tex 后重新运行脚本，不要直接改这里。 -->
<div class="deck" data-chapter="{{CHAPTER}}">

{{SLIDES}}

</div>
<script src="demos/assets/katex/katex.min.js"></script>
<script src="demos/assets/katex/contrib/auto-render.min.js"></script>
<script src="demos/assets/slides.js"></script>
</body>
</html>
'''

if __name__ == '__main__':
    main()
