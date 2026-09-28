# Complex Analysis Lecture Notes | 复变函数课程讲义

本仓库收录本科《复变函数》课程的课堂幻灯片、LaTeX 源文件和补充阅读材料。课程面向电子信息工程等相关专业的本科生，内容侧重复变函数的基本概念、数学方法及其工程背景。

This repository contains lecture slides, LaTeX source files, and supplementary reading materials for an undergraduate course in Complex Analysis. The course is intended for students in Electronic Information Engineering and related programs, with an emphasis on fundamental concepts, mathematical methods, and connections to engineering.

## 仓库内容 | Repository Contents

```text
.
├── Chapter1/
│   ├── pdf/                      # PDF 版：LaTeX 源文件、PDF 与插图
│   │   ├── CF_Chapter1.tex
│   │   ├── CF_Chapter1.pdf
│   │   └── Figure_1_*.jpg
│   └── html/                     # HTML 版：可嵌入交互演示的课件
│       ├── CF_Chapter1.html      # 由 tools/tex2html.py 从 pdf/CF_Chapter1.tex 生成
│       ├── figures/              # 插图副本
│       ├── demos/                # 9 个交互演示（index.html 为目录）及公共资源 assets/
│       └── tools/tex2html.py
├── Chapter2/
│   ├── pdf/                      # PDF 版：LaTeX 源文件、PDF 与插图
│   │   ├── CF_Chapter2.tex
│   │   ├── CF_Chapter2.pdf
│   │   └── Figure_2_1.jpg
│   └── html/                     # HTML 版（结构同第 1 章）
│       ├── CF_Chapter2.html
│       ├── figures/
│       ├── demos/                # 8 个交互演示及公共资源 assets/
│       └── tools/                # tex2html.py 与本章的 demos_config.py
├── Chapter3/
│   ├── pdf/                      # PDF 版：LaTeX 源文件、PDF 与插图
│   │   ├── CF_Chapter3.tex
│   │   ├── CF_Chapter3.pdf
│   │   └── Figure_3_*.jpg
│   └── html/                     # HTML 版（结构同第 1 章）
│       ├── CF_Chapter3.html
│       ├── figures/
│       ├── demos/                # 5 个交互演示及公共资源 assets/
│       └── tools/                # tex2html.py 与本章的 demos_config.py
├── Chapter4/
│   ├── CF_Chapter4.tex
│   └── CF_Chapter4.pdf
├── Chapter5/
│   ├── CF_Chapter5.tex
│   └── CF_Chapter5.pdf
└── Supplementary/
    ├── 01_Modular_Arithmetic.tex
    └── 01_Modular_Arithmetic.pdf
```

- `Chapter1` 至 `Chapter5`：各章课堂幻灯片及其 LaTeX 源文件。
- `Supplementary`：用于补充课堂内容的独立阅读材料。
- PDF 文件可直接阅读，TeX 文件可用于修改和重新编译。

- `Chapter1` through `Chapter5`: lecture slides and their LaTeX source files.
- `Supplementary`: standalone readings that expand on topics introduced in class.
- PDF files are ready for reading, while TeX files can be edited and recompiled.

## 补充阅读 | Supplementary Readings

1. **模算术与角度的模 \(2\pi\) 运算**  
   **Modular Arithmetic and Angles Modulo \(2\pi\)**

   介绍模 \(2\pi\) 同余、代表值区间、幅角主值以及复数乘除法中的幅角计算。

   Introduces congruence modulo \(2\pi\), representative intervals, principal arguments, and argument calculations in complex multiplication and division.

## 编译方法 | Building the Slides

课件和补充材料使用 LaTeX 编写，建议使用 XeLaTeX 编译。请确保 LaTeX 环境已经安装中文支持，例如 TeX Live 或 MiKTeX 中的 `ctex` 宏包。

The slides and supplementary notes are written in LaTeX and should be compiled with XeLaTeX. A LaTeX distribution with Chinese-language support is required, such as TeX Live or MiKTeX with the `ctex` package.

编译某一章：

```bash
cd Chapter1/pdf
xelatex CF_Chapter1.tex
xelatex CF_Chapter1.tex
```

Compile a supplementary reading:

```bash
cd Supplementary
xelatex 01_Modular_Arithmetic.tex
xelatex 01_Modular_Arithmetic.tex
```

连续编译两次可以正确更新目录、引用和页码等信息。

### HTML 课件（第 1–3 章）| HTML Slides (Chapters 1–3)

`ChapterN/html/CF_ChapterN.html` 是各章的 HTML 版课件（目前有第 1–3 章），一个 frame 对应一页，页码与 PDF 一致，并在相关页面嵌入了交互演示。全部资源（含 KaTeX）都在本地，双击即可离线打开；拷贝时请复制整个 `html` 文件夹。

修改 `pdf/CF_ChapterN.tex` 之后，运行对应章节的脚本重新生成 HTML（演示入口写在同目录的 `demos_config.py` 中）：

```bash
python Chapter1/html/tools/tex2html.py
python Chapter2/html/tools/tex2html.py
python Chapter3/html/tools/tex2html.py
```

操作：→ / 空格 / 点击为下一步，← 为上一步，F 全屏，输入页码后按回车跳页；演示打开后按 Esc 返回。

Running XeLaTeX twice ensures that references, navigation information, and page numbers are updated correctly.

## 记号约定 | Notation Convention

本课程使用以下幅角记号：

$$
\operatorname{Arg} z \quad \text{表示所有幅角},
\qquad
\arg z \quad \text{表示幅角主值}.
$$

In these notes, the notation for complex arguments is:

$$
\operatorname{Arg} z \quad \text{for the set of all arguments},
\qquad
\arg z \quad \text{for the principal argument}.
$$

## 使用说明 | Usage

本仓库主要用于课程教学、课堂复习和个人学习。内容仍在持续整理中，公式、术语和版式可能继续更新。

This repository is intended primarily for teaching, course review, and personal study. The materials are under active revision, and mathematical notation, terminology, and formatting may continue to improve.
