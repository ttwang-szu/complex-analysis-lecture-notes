"""第 2 章 HTML 课件的配置：演示入口与插图尺寸。"""
import re

_E = re.escape

# 交互演示入口：match 是在 frame 源码中查找的正则，命中的第一页放按钮
DEMOS = [
    dict(match=_E('Hence $f(z)=z^2$ is differentiable everywhere'), src='demos/01-difference-quotient.html#embed&fn=z2', label='交互演示：Δz 绕一圈，差商收缩到 2z'),
    dict(match=_E('Figure_2_1.jpg'), src='demos/01-difference-quotient.html#embed&fn=lin', label='交互演示：2x + yi 的差商依赖方向'),
    dict(match=_E('Analyticity is a neighborhood property'), src='demos/03-cr-heatmap.html#embed&fn=abs2', label='交互演示：只在一点可导 ≠ 解析'),
    dict(match=_E('Cauchy--Riemann equations（柯西'), src='demos/02-local-linear.html#embed&fn=z2', label='交互演示：C–R 方程 = 局部伸缩 + 旋转'),
    dict(match=_E('where they are analytic'), src='demos/03-cr-heatmap.html#embed&fn=zre', label='交互演示：C–R 方程在哪里成立'),
    dict(match=_E('Prove that $\\overline{z}^2$ is analytic nowhere'), src='demos/03-cr-heatmap.html#embed&fn=conj2', label='交互演示：z̄² 只在原点满足 C–R'),
    dict(match=_E('Find the constants $a$'), src='demos/03-cr-heatmap.html#embed&fn=ex23', label='交互演示：拖动滑块求 a, b, c, d'),
    dict(match=_E('my^3+nx^2y'), src='demos/03-cr-heatmap.html#embed&fn=ex26', label='交互演示：拖动滑块求 l, m, n'),
    dict(match=_E('curve families'), src='demos/04-orthogonal.html#embed&fn=z2', label='交互演示：两族等值线互相垂直'),
    dict(match=_E('the exponential function（指数函数）'), src='demos/05-exp-map.html#embed', label='交互演示：w = eᶻ 的映射'),
    dict(match=_E('fundamental period $2\\pi i$: '), src='demos/05-exp-map.html#embed&mode=strip', label='交互演示：周期 2πi 与水平带'),
    dict(match=_E('called a branch（分支）'), src='demos/06-log-branches.html#embed', label='交互演示：Ln z 的值与分支'),
    dict(match=_E('is discontinuous on the negative real axis'), src='demos/06-log-branches.html#embed', label='交互演示：绕原点一圈，主值跳变'),
    dict(match=_E('Unlike the real case'), src='demos/07-sine.html#embed&fn=sin', label='交互演示：|sin z| 无界'),
    dict(match=_E('Solve the equation $\\sin z=i\\sinh 1$'), src='demos/07-sine.html#embed&fn=sin', label='交互演示：解在热图上的位置'),
    dict(match=_E('Solve the equation $\\abs{\\tanh z}=1$'), src='demos/07-sine.html#embed&fn=tanh', label='交互演示：|tanh z| = 1 的水平线'),
    dict(match=_E('coprime integers'), src='demos/08-power.html#embed&p=0', label='交互演示：a^{p/q} 恰有 q 个值'),
    dict(match=_E('Find the values of $1^{\\sqrt{2}}$ and $i^i$'), src='demos/08-power.html#embed&p=5', label='交互演示：i^i 与 1^{√2} 的所有值'),
    dict(match=_E('Find the values of $(-3)^{\\sqrt{5}}$'), src='demos/08-power.html#embed&p=4', label='交互演示：(−3)^{√5} 的值'),
    dict(match=_E('Find the principal argument of $(1+i)^i$'), src='demos/08-power.html#embed&p=6', label='交互演示：所有值幅角相同'),
]

# 个别插图在 HTML 版中单独指定最大高度（px），不影响 PDF
FIG_HEIGHT = {}
