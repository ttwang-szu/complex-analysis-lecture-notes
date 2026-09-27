"""第 1 章 HTML 课件的配置：演示入口与插图尺寸。"""

# 交互演示入口：match 是在 frame 源码中查找的正则，命中的第一页放按钮
DEMOS = [
    dict(match=r'\\tag\{1\.1\.5\}', src='demos/04-argument.html#embed', label='交互演示：幅角与主值'),
    dict(match=r'Figure_1_4\.jpg', src='demos/01-multiplication.html#embed', label='交互演示：乘法 = 伸缩 + 旋转'),
    dict(match=r'Which expression scales', src='demos/01-multiplication.html#embed', label='交互演示：做这道选择题'),
    dict(match=r'Figure_1_5_a\.jpg', src='demos/02-roots.html#embed', label='交互演示：n 次方根'),
    dict(match=r'Figure_1_6\.jpg', src='demos/02-roots.html#embed&z=1&n=6', label='交互演示：六次单位根'),
    dict(match=r'Figure_1_9\.jpg', src='demos/06-riemann-sphere.html#embed', label='交互演示：复球面'),
    dict(match=r'N_R\(\\infty\)=', src='demos/06-riemann-sphere.html#embed&mode=nbhd', label='交互演示：∞ 的邻域'),
    dict(match=r'Figure_1_17\.jpg', src='demos/03-z-squared.html#embed&mode=sector', label='交互演示：扇形 → 扇形'),
    dict(match=r'Figure_1_18\.jpg', src='demos/03-z-squared.html#embed&mode=hyper', label='交互演示：双曲线 → 直线'),
    dict(match=r'Figure_1_19\.jpg', src='demos/03-z-squared.html#embed&mode=lines', label='交互演示：直线 → 抛物线'),
    dict(match=r'u=\\frac52\\cos\\theta', src='demos/05-joukowski.html#embed&mode=circle&r=2', label='交互演示：改变半径 r，看椭圆怎么变'),
    dict(match=r'Figure_1_20\.jpg', src='demos/08-limit-epsilon-delta.html#embed', label='交互演示：ε–δ 邻域'),
    dict(match=r'The same value \$A\$ must be obtained', src='demos/07-limit-paths.html#embed', label='交互演示：沿不同路径趋近'),
    dict(match=r'Intuition: Uniqueness of the Limit', src='demos/08-limit-epsilon-delta.html#embed&b=1', label='交互演示：假设还有另一个极限 B'),
    dict(match=r'Intuition: Local Boundedness', src='demos/08-limit-epsilon-delta.html#embed&eps=1', label='交互演示：取 ε = 1，看像点被“拴住”'),
    dict(match=r'Intuition: Why a Closed Bounded Parameter Interval', src='demos/09-curve-bounded.html#embed&case=0', label='交互演示：沿 C 走一遍，找最大值 M'),
    dict(match=r'has no limit as', src='demos/07-limit-paths.html#embed&fn=0', label='交互演示：Re z / |z|'),
    dict(match=r'is not continuous at the origin', src='demos/07-limit-paths.html#embed&fn=1', label='交互演示：xy / (x² + y²)'),
]

# 个别插图在 HTML 版中单独指定最大高度（px），不影响 PDF
FIG_HEIGHT = {'Figure_1_17.jpg': 360}
