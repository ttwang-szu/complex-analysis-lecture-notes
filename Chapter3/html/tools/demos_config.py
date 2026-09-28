"""第 3 章 HTML 课件的配置：演示入口与插图尺寸。"""
import re

_E = re.escape

# 交互演示入口：match 是在 frame 源码中查找的正则，命中的第一页放按钮
DEMOS = [
    dict(match=_E('Remarks on the definition'), src='demos/01-riemann-sum.html#embed&p=ex11', label='交互演示：小步 f(ζₖ)Δzₖ 首尾相接'),
    dict(match=_E('Compute $\\int_C z\\dif z$, where $C$ is the line segment'), src='demos/01-riemann-sum.html#embed&p=ex11', label='交互演示：黎曼和逼近 (3 + 4i)²/2'),
    dict(match=_E('Compute $\\int_C \\operatorname{Re}z\\dif z$'), src='demos/01-riemann-sum.html#embed&p=ex12a', label='交互演示：三条路径的黎曼和'),
    dict(match=_E('three different values'), src='demos/02-path-dependence.html#embed&fn=re', label='交互演示：拖动路径，Re z 的积分随之改变'),
    dict(match=_E('Compute $\\oint_C \\abs{z}\\dif z$'), src='demos/01-riemann-sum.html#embed&p=ex13', label='交互演示：2Δz 绕一圈回到原点'),
    dict(match=_E('Compute $\\oint_C \\frac{1}{(z-z_0)^{n+1}}\\dif z$'), src='demos/01-riemann-sum.html#embed&p=ex14', label='交互演示：为什么 n = 0 时是 2πi'),
    dict(match=_E('\\abs{\\int_C \\frac{1}{z^2}\\dif z}\\leq 2'), src='demos/01-riemann-sum.html#embed&p=ex15', label='交互演示：Sₙ 跑不出半径 ML 的圆'),
    dict(match=_E('seems to be decided by the analyticity'), src='demos/02-path-dependence.html#embed&fn=z', label='交互演示：解析 vs 不解析，积分与路径'),
    dict(match=_E('Cauchy--Goursat Theorem（'), src='demos/03-contour-deform.html#embed&p=e21', label='交互演示：闭曲线内没有奇点，积分为 0'),
    dict(match=_E('Compute $\\oint_{\\abs{z-i}=\\frac{1}{2}} \\frac{1}{z(z^2+1)}\\dif z$.'), src='demos/03-contour-deform.html#embed&p=e22', label='交互演示：只有 z = i 在圆内'),
    dict(match=_E('Counterexample: $f(z)=\\frac{1}{z}$ is analytic in the annulus'), src='demos/03-contour-deform.html#embed&p=q23', label='交互演示：∮ dz/z² = 0，但 0 是奇点'),
    dict(match=_E('Consider $\\oint_{\\abs{z}=2}\\frac{1}{z-1}\\dif z$'), src='demos/03-contour-deform.html#embed&p=m3', label='交互演示：把 |z| = 2 变形成绕 1 的小圆'),
    dict(match=_E('Principle of deformation of paths（'), src='demos/03-contour-deform.html#embed&p=m3', label='交互演示：闭路变形，积分不变'),
    dict(match=_E('Compute $\\oint_{\\Gamma}\\frac{2z-1}{z^2-z}\\dif z$'), src='demos/03-contour-deform.html#embed&p=e31', label='交互演示：两个奇点各贡献 2πi'),
    dict(match=_E('depends only on the initial point and the terminal point'), src='demos/02-path-dependence.html#embed&fn=z', label='交互演示：两条路径，积分相同'),
    dict(match=_E('This is Cauchy\'s integral formula（'), src='demos/04-cauchy-formula.html#embed', label='交互演示：边界的值决定内部的值'),
    dict(match=_E('Mean value formula（'), src='demos/04-cauchy-formula.html#embed', label='交互演示：圆心的值 = 圆周上的平均值'),
    dict(match=_E('Compute $\\oint_{C}\\frac{\\sin\\frac{\\pi z}{4}}{z^2-1}\\dif z$'), src='demos/03-contour-deform.html#embed&p=e54', label='交互演示：三条曲线分别围住哪些奇点'),
    dict(match=_E('higher-order derivative formula（'), src='demos/04-cauchy-formula.html#embed&n=1', label='交互演示：用边界上的值算导数'),
    dict(match=_E('Compute the following integrals, where $C:\\abs{z}=r>1$'), src='demos/03-contour-deform.html#embed&p=e61', label='交互演示：±i 两个奇点的贡献'),
    dict(match=_E('Compute $\\oint_C \\frac{1}{(z-2)^2 z^3}\\dif z$'), src='demos/03-contour-deform.html#embed&p=e62', label='交互演示：两个贡献恰好抵消'),
    dict(match=_E('How do we compute an integral along a simple closed curve'), src='demos/03-contour-deform.html#embed&p=e31', label='交互演示：先看曲线围住了哪些奇点'),
    dict(match=_E('is called a harmonic function（'), src='demos/05-harmonic.html#embed&u=sq', label='交互演示：调和函数的平均值性质'),
    dict(match=_E('Prove that $u(x,y)=y^3-3x^2y$ is harmonic'), src='demos/05-harmonic.html#embed&u=ex71', label='交互演示：u 与共轭调和函数 v'),
    dict(match=_E('need not be analytic'), src='demos/05-harmonic.html#embed&u=bad', label='交互演示：x² + y² 不是调和函数'),
]

# 个别插图在 HTML 版中单独指定最大高度（px），不影响 PDF
FIG_HEIGHT = {'Figure_3_2_2.jpg': 230, 'Figure_3_2_3.jpg': 230, 'Figure_3_2_4.jpg': 230, 'Figure_3_3_2.jpg': 190, 'Figure_3_6_1.jpg': 170}
