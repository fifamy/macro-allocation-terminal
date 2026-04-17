#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
将 data/ 下的多个 JSON 文件打包为前端可直接引用的 JS bundle，
并把理论底稿中的章节内容拆入对应框架，作为知识库详细内容。
"""

import json
import re
from datetime import datetime
from pathlib import Path

from build_macro_dashboard_data import build_dashboard_data


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
CONTENT_DIR = ROOT / "content"
OUTPUT_JS = DATA_DIR / "macro_allocation_bundle.js"
OUTPUT_JSON = DATA_DIR / "macro_allocation_bundle.json"


def read_json(name):
    path = DATA_DIR / name
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def read_text(path):
    return path.read_text(encoding="utf-8")


CHAPTER_TO_FRAMEWORK = {
    "第一章 美林投资时钟（The Investment Clock）": "investment-clock",
    "第二章 货币信用框架": "money-credit",
    "第三章 库存周期（基钦周期）": "inventory-cycle",
    "第四章 朱格拉周期与康波周期": "juglar-kondratieff",
    "第五章 风险平价与全天候策略": "risk-parity",
    "第六章 Black-Litterman 与组合优化理论": "black-litterman",
}


REPORT_ENRICHMENTS = {
    "money-credit": {
        "起源与核心思想": [
            "《宏观经济与大类资产配置研究框架》进一步强调，在中国市场中，流动性周期往往是理解资产轮动的起点，不能只用增长与通胀四象限替代货币信用传导。",
            "报告把流动性、实体短周期、价格周期、权益周期、汇率周期与黄金美元放进一套链条里，说明货币信用框架本质上是一个更大的本土化资产配置系统入口。",
        ],
        "关键指标与测度": [
            "除社融和信贷外，还应联动观察政策取向、资金价格、直接融资、风险偏好和名义增长，避免只看总量口径。",
            "对中国市场而言，利率债通常最先反映流动性变化，而权益和汇率更多反映信用扩张、风险偏好与名义增长改善。",
        ],
        "中国本土化应用": [
            "从报告的中国经验看，宽货币但信用未起时更偏债；当信用真正扩张并开始向实体传导时，权益和信用债的配置胜率明显提升。",
        ],
    },
    "inventory-cycle": {
        "起源与核心思想": [
            "《库存周期的误区、分歧与辨析》指出，库存周期最大的价值不只是阶段命名，而是帮助厘清企业行为如何滞后于需求变化，并辅助判断经济所处阶段。",
            "这份报告也提醒，库存周期是高频讨论中最容易被过度使用的框架之一，尤其不适合作为万能主框架。",
        ],
        "关键指标与测度": [
            "报告建议优先使用 PPI 与名义库存的组合，更贴近市场共识，也更适合资产配置讨论；所谓“实际库存”并不一定比名义库存更接近真实经营状态。",
        ],
        "各状态下的资产表现": [
            "报告明确将库存周期与美林时钟做映射：被动去库对应复苏、主动补库对应过热、被动补库对应滞胀、主动去库对应衰退。",
            "这说明库存周期更适合作为宏观情景与资产映射之间的验证层，而不是首页主结论的唯一来源。",
        ],
        "局限性与失效情形": [
            "在需求持续低迷时，低库存并不意味着会立刻进入补库存阶段；政策与地产周期也会对库存信号形成明显扰动。",
        ],
    },
    "risk-parity": {
        "起源与核心思想": [
            "《风险平价模型风险测度探讨》把等权、均值方差、风险平价放在同一框架里比较，强化了“风险平价的本质是风险预算，而不是平均持仓”这一点。",
        ],
        "风险平价的数学基础": [
            "报告进一步讨论波动率、下行波动率、CVaR、最大回撤等不同风险定义，说明“风险怎么定义”会直接影响配置结果。",
        ],
        "全天候策略的宏观配置": [
            "Bridgewater 的全天候思路与国内报告中的风险平价扩展结合后，可以自然过渡到“按宏观观点调整风险预算”的体系，而不是停留在静态平衡配置。",
        ],
        "中国本土化应用": [
            "国内实务报告通过季度调仓回测发现，多种风险平价和主动风险模型在风险收益指标上优于简单等权模型，说明它在本土多资产框架中具备底座价值。",
        ],
        "局限性与失效情形": [
            "报告补充说明，不同风险测度、再平衡频率和交易约束都会改变结果，因此风险平价不能脱离流动性与制度环境单独讨论。",
        ],
    },
    "black-litterman": {
        "起源与核心思想": [
            "《Black-Litterman + 风险平价 + CVaR》展示了一条完整链路：先用风险平价和 CVaR 构建风险均衡底座，再把主观宏观预期通过 Black-Litterman 融入后验收益与最终权重。",
            "这说明 Black-Litterman 的真正用途，是让主观观点以更平滑、更可控的方式进入组合，而不是替代研究判断本身。",
        ],
        "在大类资产配置中的应用": [
            "报告把大类资产配置拆成三层：风险配置做基础、主动预期做增量、组合优化降风险，这非常适合定义研究终端未来从“观点页”升级到“配置引擎”的路径。",
            "它还展示了 ETF 标的筛选、海内外宏观分析与季度资产配置建议如何连接，说明优化器不是孤立运行，而要嵌在研究流程里。",
        ],
        "组合优化理论与识别框架的结合": [
            "对当前终端而言，这类框架最适合把“超配 / 中性 / 低配”结论进一步转为权重区间中枢，而不必一步跳到完全自动化。",
        ],
        "组合优化的一般性陷阱": [
            "国内实务经验再次证明：如果没有清晰的主观观点强度、置信度和约束条件，优化器只会放大输入问题，而不会自动修正研究偏差。",
        ],
    },
}


AUTO_FRAMEWORK_SOURCE_SECTIONS = {
    "financial-cycle": [
        {
            "title": "金融周期的配置意义",
            "content": "\n".join(
                [
                    "- 金融周期关注杠杆、地产、信用扩张和资产负债表修复，通常比库存和普通商业周期更慢，也更像长期约束条件。",
                    "- 在中国市场里，金融周期往往决定的是股债内部风格、信用扩张质量和地产链拖累，而不只是总量增长方向。",
                    "- 因此它特别适合解释“为什么经济看起来没有剧烈变化，但资产表现已经明显分化”。",
                ]
            ),
        },
        {
            "title": "关键指标与识别顺序",
            "content": "\n".join(
                [
                    "- 核心观察对象包括社融结构、企业中长期贷款、地产销售与房价、居民杠杆、银行风险偏好和信用利差。",
                    "- 对中国而言，还要区分金融周期是供给主导还是需求主导，因为 2016 年前后地产和居民加杠杆逻辑已经发生明显变化。",
                    "- 当货币已宽但地产和信用需求没有跟上时，更像金融周期修复早期；只有信用真正扩散到实体，才更接近右侧确认。",
                ]
            ),
        },
        {
            "title": "与资产配置的连接方式",
            "content": "\n".join(
                [
                    "- 金融周期修复初期通常更利好利率债与高股息，权益更多表现为结构性机会，而不是全面牛市。",
                    "- 当信用扩张进入确认期，信用债与股票的配置胜率才会明显抬升，地产链和顺周期资产也更容易接棒。",
                    "- 如果金融周期进入收缩或去杠杆阶段，要优先防范信用下沉、股债双杀和久期误配，而不是只盯着 GDP 与 CPI。",
                ]
            ),
        },
    ],
    "leading-indicators": [
        {
            "title": "识别逻辑：先判断位置，再判断方向",
            "content": "\n".join(
                [
                    "- 领先指标的核心价值不是精确预测单点，而是回答当前更接近上行初期、上行中段还是下行尾声。",
                    "- 比起只问“数据变好还是变坏”，更重要的是判断改善是否已经扩散到信用、盈利、就业和资产价格。",
                    "- 这也是为什么六阶段位置法比单一拐点判断更适合配置节奏管理。",
                ]
            ),
        },
        {
            "title": "常用指标组合与验证顺序",
            "content": "\n".join(
                [
                    "- 实务上更适合把 PMI 新订单、库存、社融结构、信用利差、收益率曲线、资本流动和风险资产价格放在一起看。",
                    "- 软数据可以先给方向，硬数据负责确认；如果二者持续背离，应优先承认趋势尚未完成验证。",
                    "- 对中国市场而言，地产、出口和政策表态经常改变领先指标的兑现速度，因此不能机械照抄国际模型。",
                ]
            ),
        },
        {
            "title": "配置应用：何时从防守切向进攻",
            "content": "\n".join(
                [
                    "- 当领先指标改善只停留在预期层面时，资产上更适合“债券先行、权益观察”；当信用和盈利同步改善时，才适合提高风险预算。",
                    "- 如果资产价格已经明显领先，但硬数据仍弱，应把它理解为左侧交易而不是右侧确认。",
                    "- 因此领先指标框架最适合作为所有宏观结论的执行闸门，而不是替代主框架本身。",
                ]
            ),
        },
    ],
    "pring-six-stage": [
        {
            "title": "起源与核心思想",
            "content": "\n".join(
                [
                    "- Martin Pring 的六阶段框架本质上是对传统四象限周期框架的细化。它不再只看增长和通胀两个结果变量，而是把先行、同步、滞后三类指标拆开观察，从而解释政策干预下的过渡态和跨阶段跳转。",
                    "- Pring 官方材料强调，这套方法的目的不是画更复杂的时钟，而是把六个不同“季节”对应到不同资产配置机会。对投资者来说，阶段识别的价值在于资产排序和节奏管理，而不只是宏观命名。",
                    "- 德邦证券对中国市场的移植进一步说明，六阶段比四阶段更适合解释“债券先行、股票接棒、商品后验”的顺序，也更容易容纳中国市场里政策逆周期调节带来的阶段变形。",
                ]
            ),
        },
        {
            "title": "六阶段划分与资产映射",
            "content": "\n".join(
                [
                    "- 德邦系列报告给出的经典映射是：阶段 1 债券占优，阶段 2 股票占优，阶段 3 股票与商品占优，阶段 4 股票与商品仍偏强，阶段 5 商品与黄金占优，阶段 6 债券与黄金占优。",
                    "- 相较美林时钟，六阶段的优势在于能把“从滞胀滑向萧条”和“从逆周期调节走向复苏”这类中间态单独拎出来，不必强行塞进四象限。",
                    "- 在中国应用时，这种分段尤其适合解释风格轮动、板块切换以及为什么同样是增长修复，阶段 2 和阶段 3 的配置重点并不完全相同。",
                ]
            ),
        },
        {
            "title": "三类指标与中国本土化",
            "content": "\n".join(
                [
                    "- 中国版本通常把 M1、M2、信用脉冲或资金利率作为先行指标，用工业增加值和 GDP 一致预期代表同步指标，用 PPI 或 CPI 代表滞后指标。",
                    "- 德邦报告进一步提出，DR007 等回购利率可被视为“先行指标的领先指标”，因为它先于货币派生改善，是政策转向最灵敏的观测窗。",
                    "- 这意味着普林格框架在中国市场里不是抽象理论，而是可以与资金利率、信用派生、工业生产和 PPI 等可追踪变量直接绑定。"
                ]
            ),
        },
        {
            "title": "实务价值与主要难点",
            "content": "\n".join(
                [
                    "- 普林格六段论最大的实务价值，是把宏观判断从“方向”拆成“节奏”，尤其适合回答当前更像复苏早期、复苏中段，还是滞胀向萧条过渡。",
                    "- 它对大类资产、风格和行业轮动都有解释力，因此很适合做‘宏观框架 -> 风格/行业 -> 资产排序’之间的桥梁。",
                    "- 难点在于阶段识别高度依赖指标定义和时滞处理；如果同步指标确认不足，只凭先行和滞后指标，很容易把过渡态误判为完整切换。"
                ]
            ),
        },
    ],
    "money-credit-entity": [
        {
            "title": "为什么要从货币信用升级到三元框架",
            "content": "\n".join(
                [
                    "- 传统货币信用框架已经能够解释中国市场大部分债股轮动，但它仍默认货币宽松最终会较顺畅地传导到信用，再传导到实体。",
                    "- 《基于“货币-信用-实体”的三维投资框架》指出，现实中这三层并不同步：货币往往最先改善，信用派生要看融资需求和风险偏好，实体确认则更慢，尤其要看企业中长贷、资本开支和工业需求。",
                    "- 因此三元框架的意义不在于再造一个新象限，而在于把‘货币已宽、信用在修、实体待验’这种非常常见却又容易被混淆的状态表达清楚。"
                ]
            ),
        },
        {
            "title": "传导顺序与观察重点",
            "content": "\n".join(
                [
                    "- 本地报告给出的经验时滞是：货币领先信用约 2-3 个季度，信用领先实体约 6 个月。这是理解资产价格先行、总量后确认的关键。",
                    "- 货币层主要看 DR007、政策利率、收益率曲线和准备金率；信用层主要看社融结构、贷款投放、企业中长贷和信用利差；实体层主要看工业增加值、库存、利润、资本开支和商品需求。",
                    "- 真正的右侧确认不是单纯降准降息，而是信用结构和企业中长贷持续改善，并开始向盈利、库存和工业需求扩散。"
                ]
            ),
        },
        {
            "title": "与资产配置的连接方式",
            "content": "\n".join(
                [
                    "- 债券更看货币环境，因此宽货币但信用未起时，利率债通常先占优。",
                    "- 股票和信用债更看信用环境，因此信用修复阶段更适合逐步提高权益和信用资产的风险预算。",
                    "- 商品和高弹性周期板块更看实体确认，因此即使市场已经交易复苏预期，若工业需求和资本开支尚未跟上，商品的持续性也未必充足。"
                ]
            ),
        },
        {
            "title": "框架价值与局限性",
            "content": "\n".join(
                [
                    "- 三元框架非常适合解释“价格先行、总量后验”，也非常适合作为从左侧交易走向右侧确认的执行闸门。",
                    "- 它的价值在于把债、股、商品为何不一起涨跌说清楚，因此对首页当前判断页、资产映射库和情景页都很有帮助。",
                    "- 局限在于：如果外部流动性、地产链条或财政约束异常强，货币到信用、信用到实体的传导可能被打断；这时框架容易给出‘宽松但不扩散’的长期中间态。"
                ]
            ),
        },
    ],
    "four-dimensional-macro": [
        {
            "title": "框架出发点：为什么只看总量不够",
            "content": "\n".join(
                [
                    "- 《宏观环境对资产价格的影响：四个角度》最重要的贡献，是把政策面、基本面、海外环境和资本流动四条主线放进同一张图，而不是只盯增长、通胀或信用其中一个变量。",
                    "- 在中国市场里，同样的弱修复环境下，若政策态度更积极、海外环境更友好、资本流动边际转暖，资产价格表现会明显不同。",
                    "- 因此四维框架最适合回答的问题不是“经济处于哪一象限”，而是“当前价格信号为什么能走远，或者为什么走不远”。"
                ]
            ),
        },
        {
            "title": "四个维度分别看什么",
            "content": "\n".join(
                [
                    "- 政策面：货币、财政、地产、监管和稳增长取向，决定逆周期调节是加码还是减弱。",
                    "- 基本面：增长、通胀、信用、库存和盈利，决定经济修复是否真实存在并开始扩散。",
                    "- 海外环境：美债、美元、海外景气和全球流动性，决定中国资产面临的是顺风还是外部掣肘。",
                    "- 资本流动：汇率、北向/南向资金、利差与风险偏好，决定资产价格修复是否能从交易层走向持续层。"
                ]
            ),
        },
        {
            "title": "对当前判断和情景映射的价值",
            "content": "\n".join(
                [
                    "- 这个框架最适合解释首页当前已经在使用的那类表达：政策面先改善、资本流动边际转暖、基本面和实体需求仍偏慢。",
                    "- 它能帮助把‘宽货币 / 宽信用’这类总量判断，再进一步修正成‘情景能否兑现、权益修复能否持续、汇率和外资是否配合’的环境判断。",
                    "- 因而四维框架不是替代货币信用或美林时钟，而是它们的环境修正器和兑现评估器。"
                ]
            ),
        },
        {
            "title": "实务应用与常见误用",
            "content": "\n".join(
                [
                    "- 在实务里，四维框架特别适合月报、季报和投委会表达，因为它比单一总量框架更接近研究员实际的判断语言。",
                    "- 它也特别适合解释‘资产价格先行、总量后确认’这类现象：很多时候不是基本面已经完全修复，而是政策和资本流动先给了价格信号。",
                    "- 常见误用是把四维框架写成指标清单，却不区分轻重缓急；如果四个维度全都并列、没有主次，这个框架就会变得什么都能解释、什么都不够有力。"
                ]
            ),
        },
    ],
}


AUTO_SCENARIO_ENRICHMENTS = {
    "增长上行 / 通胀回落": {
        "features": [
            "若美元边际转弱、库存从去化转向温和回补，非美权益和信用资产更容易先受益。",
            "这类阶段常见“资产价格先行、总量后确认”，因此要容忍盈利和硬数据晚于市场修复。",
        ],
        "leading_indicators": [
            "美元指数走弱、信用利差回落、库存去化接近尾声。",
            "风险资产先反弹后等待盈利与融资数据接力验证。",
        ],
        "allocation_playbook": [
            "优先提高股票与信用敞口，但保留部分利率债作为总量验证未完成时的缓冲。",
            "如果只是预期修复而信用尚未扩散，更适合结构性进攻而不是全面加风险。",
        ],
        "linked_cases": [
            "2023-2024年海外软着陆交易：股票先行，硬数据后跟",
            "2019年中国信用修复初期",
        ],
    },
    "增长上行 / 通胀上行": {
        "features": [
            "当需求和价格同时走强时，资源品、价值风格和高现金流资产通常强于长久期资产。",
            "若流动性没有同步宽松，权益内部往往是风格切换而不是无差别上涨。",
        ],
        "leading_indicators": [
            "PPI、原油和工业品价格持续抬升，政策语言开始转向控杠杆或稳价格。",
            "名义增长上行快于实际增长，债券对通胀与政策收紧更敏感。",
        ],
        "allocation_playbook": [
            "商品优先于长债，权益内部更偏资源、金融和高股息板块。",
            "若通胀开始压缩估值，应降低对成长久期资产的单边暴露。",
        ],
        "linked_cases": [
            "2016年中国供给侧改革与再通胀交易",
        ],
    },
    "增长下行 / 通胀上行": {
        "features": [
            "油价或供给冲击会先抬高名义价格，再通过压缩真实收入和盈利拖累增长，是最难配置的阶段之一。",
            "这一阶段经常出现股债双杀，单靠传统股债分散不够。",
        ],
        "leading_indicators": [
            "原油、运价和输入型通胀高位运行，消费者信心和盈利预期同步走弱。",
            "政策表态往往陷入稳增长与控通胀的两难。",
        ],
        "allocation_playbook": [
            "缩短久期、提高现金和黄金权重，权益只保留防御或资源对冲仓位。",
            "只有当通胀先见顶，债券的防守价值才会重新明显提升。",
        ],
        "linked_cases": [
            "1973-2008年油价跳涨与美国衰退的历史共振",
            "2022年海外高通胀与加息周期",
        ],
    },
    "增长下行 / 通胀下行": {
        "features": [
            "资产价格往往先交易宽松与弱复苏预期，再等待信用和实体确认，这类阶段最容易出现债券先行。",
            "若金融周期修复不足，权益更偏高股息和结构性机会，而不是指数级牛市。",
        ],
        "leading_indicators": [
            "中长贷、居民杠杆和地产销售改善仍慢，但利率与汇率已经先给出宽松信号。",
            "政策面先改善、基本面后确认，是这一阶段最典型的特征。",
        ],
        "allocation_playbook": [
            "债券做底仓，权益以高股息和低波为主，待信用结构改善后再评估扩风险预算。",
            "若美元见顶回落，可逐步提高非美资产和黄金的观察优先级。",
        ],
        "linked_cases": [
            "1990年以来日本泡沫破裂后的长期低增长与政策自救",
            "2024-2025年中国低通胀与弱修复环境",
            "2014-2015年中国宽松交易：债券先行，总量后确认",
        ],
    },
    "宽货币 / 紧信用": {
        "features": [
            "政策先托底流动性，但融资需求与居民资产负债表修复仍未接上，典型表现是债强股弱或股债分化。",
        ],
        "leading_indicators": [
            "DR007、政策利率和流动性先改善，但企业中长期贷款与信用派生滞后。",
            "地产与居民融资不修复时，宽货币很难直接转成系统性风险偏好上行。",
        ],
        "allocation_playbook": [
            "先配利率债和现金等缓冲资产，权益维持观察仓位。",
            "把企业中长贷和信用结构改善视为从左侧走向右侧的核心确认信号。",
        ],
        "linked_cases": [
            "2022年中宽货币先行：中长贷拐点成为右侧确认信号",
            "2014-2015年中国宽松交易：债券先行，总量后确认",
        ],
    },
    "宽货币 / 宽信用": {
        "features": [
            "信用扩张开始从政策口径走向实体融资时，权益和信用债通常会接棒利率债成为主线。",
        ],
        "leading_indicators": [
            "社融结构改善、企业中长期贷款抬升、风险溢价回落。",
            "信用扩张若能扩散到制造业资本开支，商品与周期股的持续性会更强。",
        ],
        "allocation_playbook": [
            "从债券底仓向权益和信用资产切换，但仍要区分地产链与制造链的修复质量。",
            "若信用修复只是政策推动而非内生改善，组合不宜过快把防守仓位降到底。",
        ],
        "linked_cases": [
            "2019年中国信用修复初期",
            "2022年中美经济周期错位：A股以内为主，美股受衰退预期压制",
        ],
    },
    "紧货币 / 宽信用": {
        "features": [
            "名义增长仍强，但政策开始压制过热和杠杆，长久期资产最先承压。",
        ],
        "leading_indicators": [
            "融资仍强但资金价格抬升，利率和风险偏好开始出现背离。",
            "商品与价值风格往往领先于成长和长债。",
        ],
        "allocation_playbook": [
            "缩短债券久期，权益内部转向价值、金融与高现金流，警惕信用过热后半段回撤。",
        ],
        "linked_cases": [
            "2016年中国供给侧改革与再通胀交易",
        ],
    },
    "紧货币 / 紧信用": {
        "features": [
            "金融条件收紧会先压缩估值，再拖累盈利，是资产端最典型的去风险阶段。",
        ],
        "leading_indicators": [
            "短端利率飙升、信用利差走扩、融资增速回落。",
            "如果政策纠偏迟到，现金和短久期资产的相对价值会显著上升。",
        ],
        "allocation_playbook": [
            "提高现金和短久期配置，等待政策纠偏或利率见顶。",
        ],
        "linked_cases": [
            "2013年钱荒与流动性冲击",
            "2017-2018年金融去杠杆：信用收缩先伤股，再利多债",
        ],
    },
}


AUTO_ASSET_ENRICHMENTS = {
    "中国股票": {
        "historical_patterns": [
            "中美周期错位阶段，A 股更受国内政策和信用脉冲驱动，不宜简单把美股波动映射成国内方向。",
        ],
        "quarterly_sorting": [
            "当信用扩张进入确认期时，股票排序往往从结构性偏高转为系统性前移，但前提是盈利和风险偏好都能接住。",
        ],
        "report_risk_prompts": [
            "如果资产价格先反弹而信用与盈利迟迟不跟，股票端通常最先承受回撤。",
        ],
        "china_application_append": "结合中美周期错位和金融周期修复经验，A 股更适合按“政策脉冲是否落到信用和盈利”来决定是结构性配置还是全面扩风险预算。",
    },
    "中国利率债": {
        "historical_patterns": [
            "地产链下行和 ROE 中枢回落时，长期利率底部往往会被重新定价，利率债容易成为最先反映宽松与弱增长的资产。",
        ],
        "quarterly_sorting": [
            "在弱修复、低通胀和信用滞后阶段，卖方季报通常把利率债维持在靠前排序，直到中长贷与风险偏好真正转强。",
        ],
        "report_risk_prompts": [
            "利率债最大的风险不只是政策转向，还包括地产与财政约束缓和后带来的利率底部上移。",
        ],
        "china_application_append": "对中国利率债而言，房地产周期和全行业 ROE 中枢的下移，往往比短期单月数据更能决定利率下限。",
    },
    "中国信用债": {
        "historical_patterns": [
            "信用债要真正走出利差压缩行情，通常需要企业中长期贷款和内生融资需求一起改善，而不是只有总量社融上行。",
        ],
        "report_risk_prompts": [
            "若地产链和弱资质主体仍处在修复早期，信用下沉往往比拉长久期更危险。",
        ],
        "china_application_append": "配置信用债时，应把金融周期、地产链条和企业中长贷改善放在一起看，避免把“政策宽信用”误读成“信用风险已经消失”。",
    },
    "中国商品/黄金": {
        "historical_patterns": [
            "油价冲击阶段，黄金往往比一般工业品更能承担防守功能；只有当需求和补库同步改善时，工业品才会重新接棒。",
        ],
        "quarterly_sorting": [
            "再通胀初期工业品排序可以明显前移，但若只是供给冲击抬价，黄金通常比工业品更稳。",
        ],
        "report_risk_prompts": [
            "商品端最常见的误判是把供给冲击当成持续景气，把油价上涨误当成总需求走强。",
        ],
    },
    "中国货币/现金": {
        "historical_patterns": [
            "在股债双杀、钱荒或政策不确定性上升时，现金不仅是防守仓位，也是下一轮再平衡最重要的弹药。",
        ],
        "report_risk_prompts": [
            "高不确定阶段持有现金并非消极，而是为等待信用和盈利确认保留选择权。",
        ],
    },
    "海外股票": {
        "historical_patterns": [
            "软着陆阶段美股常先于硬数据修复，但一旦盈利兑现跟不上，回撤也会来得更快。",
        ],
        "report_risk_prompts": [
            "海外股票的关键风险不只是衰退，还包括期限溢价重估和科技资本开支预期降温。",
        ],
        "china_application_append": "把海外股票放进组合时，更适合作为全球流动性和软着陆交易的表达，而不是中国风险偏好的简单外推。",
    },
    "海外债券": {
        "historical_patterns": [
            "海外长债收益更依赖降息预期与期限溢价变化，不是只要增长下行就一定上涨。",
        ],
        "report_risk_prompts": [
            "高通胀和强财政供给阶段，海外长债可能与股票一起承压，传统分散关系会弱化。",
        ],
    },
    "美元/外汇": {
        "historical_patterns": [
            "中美周期错位和全球风险偏好切换，会显著改变美元的对冲价值与人民币资产表现。",
        ],
        "report_risk_prompts": [
            "若美元强势来自真实利率和避险需求共振，单靠国内宽松很难对冲汇率压力。",
        ],
    },
    "REITs/另类": {
        "historical_patterns": [
            "REITs 同时受利率和底层现金流影响，地产基本面偏弱时，即使利率下行也未必立刻转成强弹性资产。",
        ],
        "report_risk_prompts": [
            "把 REITs 只当成降息受益资产，容易忽视租金、空置率和资产负债表约束。",
        ],
    },
}


AUTO_METHOD_ENRICHMENTS = {
    "风险平价 / 全天候": {
        "usage": [
            "中国版全天候更适合做“债券底仓 + 股票/商品/黄金分阶段抬升”的动态配置，而不是机械沿用海外固定参数。",
            "不同风险定义会直接改变配置结果，因此风险平价不能只讲概念，还要说明波动率、回撤和尾部风险的差异。",
        ]
    },
    "宏观因子风险预算": {
        "usage": [
            "六周期配置和 FOF 跟踪结果说明，宏观判断可以先转成因子风险预算，再映射到股、债、黄金之间的动态权重。",
            "如果当前只是左侧宽松而非右侧确认，因子风险预算应先上调债券和黄金，而不是直接把股票提到高位。",
        ]
    },
    "Black-Litterman": {
        "usage": [
            "在 ETF 宏观择时框架里，Black-Litterman 更适合放在最后一跳，用来把场景判断和资产排序转成可交易权重。",
            "真正需要输入的不是一句“看多”，而是观点强度、置信度和约束条件，否则优化器只会放大判断噪音。",
        ]
    },
    "情景映射 + 区间权重": {
        "usage": [
            "最稳妥的落地方式不是一次性给点位权重，而是先按左侧、过渡期、右侧确认划分区间，再随着信用和盈利验证逐步移动中枢。",
            "如果情景判断主要来自价格先行信号，区间权重应更保守；如果领先指标、信用和盈利三者共振，才适合向上沿靠拢。",
        ]
    },
}


AUTO_CURATED_HISTORICAL_CASES = [
    {
        "title": "1973-2008年油价跳涨与美国衰退的历史共振",
        "period": "1973-2008",
        "regime": "增长下行 / 通胀上行 -> 增长下行 / 通胀下行",
        "macro_background": "1973 年后美国经历的多轮衰退中，油价跳涨往往先于经济下行出现。油价不仅反映供需和地缘政治，还会通过挤压居民消费、改变贸易条件和影响通胀预期，放大经济向衰退切换的压力。",
        "asset_performance": [
            "油价大幅上行阶段，商品和能源资产相对占优，但股债组合的稳定性明显下降。",
            "一旦油价冲击开始压制需求，风险资产通常先承压，随后债券在增长下行确认后重新受益。",
            "黄金和美元在高通胀与衰退预期交织阶段更容易承担对冲角色。",
        ],
        "takeaways": [
            "油价上涨不是衰退的充分条件，但在美国历史上经常是衰退前夜的重要预警信号。",
            "研究商品周期不能只看供给冲击，更要把油价放回增长、通胀与政策反应函数里一起判断。",
        ],
        "source_report_title": "总量联合行业深度报告：油价与经济周期-以史为鉴，见微知著",
    },
    {
        "title": "2022年中美经济周期错位：A股以内为主，美股受衰退预期压制",
        "period": "2022",
        "regime": "国内弱修复 / 海外紧缩放缓",
        "macro_background": "在中国经济下行探底、美国处于高通胀紧缩周期的背景下，中美资产进入错位运行。历史复盘显示，当中国先见到经济拐点而美国仍在下滑阶段时，A 股往往更受国内政策与修复节奏主导，而美股仍受海外衰退预期压制。",
        "asset_performance": [
            "A 股在国内政策和经济预期边际改善后，更容易走出以内为主的独立波动。",
            "美股在加息与盈利下修阶段更容易围绕衰退交易反复震荡。",
            "跨市场相关性在周期错位阶段往往下降，简单照搬海外风险偏好并不稳妥。",
        ],
        "takeaways": [
            "当中美周期错位时，国内资产不一定跟随美股同步定价，配置上更应回到本土信用和政策脉冲。",
            "周期错位阶段尤其适合把“国内主线”和“海外扰动”拆开看，而不是用单一全球风险偏好解释全部资产。",
        ],
        "source_report_title": "策略周报：中美经济周期错位背景下中美股市表现回顾",
    },
    {
        "title": "1990年以来日本泡沫破裂后的长期低增长与政策自救",
        "period": "1990-2024",
        "regime": "增长下行 / 通胀下行",
        "macro_background": "日本泡沫经济破裂后进入长期低增长、低通胀乃至通缩环境。尽管货币政策从降息、量化宽松、收益率曲线控制一路走到负利率，财政政策也多次发力，但人口老龄化、高债务和结构改革缓慢共同压制了金融修复的斜率。",
        "asset_performance": [
            "长期低增长环境下，利率中枢显著下移，债券和类债资产的战略地位抬升。",
            "权益市场并非没有机会，但更依赖出口、产业升级和政策催化，而不是传统信用扩张。",
            "结构性改革推进不足时，宽松政策更容易托底资产而非带来持续高增长。",
        ],
        "takeaways": [
            "泡沫破裂后的修复周期可能远长于普通商业周期，不能把政策宽松直接等同于趋势性复苏。",
            "对当下低通胀、弱信用环境的研究，日本经验更适合作为约束条件和风险镜像，而不是直接的投资模板。",
        ],
        "source_report_title": "投资策略研究专题报告：病灶仍在-战后日本经济周期与自我拯救",
    },
    {
        "title": "2000年以来中国库存周期的六轮经验",
        "period": "2000-2023",
        "regime": "库存周期专题",
        "macro_background": "从 2000 年以来工业企业产成品库存变化看，中国大致经历了六轮较完整库存周期。补库强弱、持续时间和对资产的映射，并不只由库存本身决定，更取决于需求扩张、企业利润改善以及政策和地产周期是否同步配合。",
        "asset_performance": [
            "需求和利润共同改善时，主动补库阶段更容易带动商品、周期股和制造链盈利同步修复。",
            "被动去库通常持续时间较短，往往意味着需求端拐点已开始先于库存指标出现。",
            "若需求偏弱，即便企业开启补库，行情也可能停留在阶段反弹而非趋势扩张。",
        ],
        "takeaways": [
            "库存周期更适合作为需求和盈利变化的验证层，而不是独立决定全市场资产排序的主框架。",
            "研究库存周期时，应同时观察营收、PPI、政策脉冲和地产出口环境，否则很容易高估补库持续性。",
        ],
        "source_report_title": "经济周期专题：库存周期的历史经验",
    },
    {
        "title": "2017-2018年金融去杠杆：信用收缩先伤股，再利多债",
        "period": "2017-2018",
        "regime": "紧货币 / 紧信用 -> 增长下行 / 通胀下行",
        "macro_background": "金融去杠杆阶段，信用扩张和风险偏好先被压制，股票与信用资产通常先承受估值回撤；随着融资和盈利走弱逐步传导到经济，债券才开始重新体现防守价值。这个阶段的关键不是总量立刻失速，而是信用周期和政策信号先改变了资产排序。",
        "asset_performance": [
            "信用紧缩初期，股票往往先经历牛尾熊头，信用利差也开始重新走扩。",
            "长久期债券在前期受制于去杠杆和资金利率，但当增长下行确认后会重新转强。",
            "现金和高等级资产在信用收缩中后段的相对价值明显提高。",
        ],
        "takeaways": [
            "信用周期通常先于经济硬数据改变资产表现，去杠杆阶段尤其不能只等总量数据再行动。",
            "研究股债切换时，要区分“政策收紧压估值”和“增长下行利多债券”这两个时间错位的过程。",
        ],
        "source_report_title": "策略专题：经济周期与信用周期及资产配置的逻辑",
        "chart_preview": {
            "page_number": 8,
            "label": "信用紧缩阶段股弱债强的资产切换",
            "image_path": "research-task/generated/external-reports/charts/2019-08-28-9b9149e2bc/page-008.png",
        },
    },
    {
        "title": "2021-2022年地产链下行与长期利率下移：中国债强股弱的再验证",
        "period": "2021-2022",
        "regime": "增长下行 / 通胀下行 + 宽货币 / 紧信用",
        "macro_background": "地产行业利润和居民加杠杆进入下行阶段后，中国长期利率的底部被重新打开。宽松更多先在金融体系内部传导，债券先受益，而股票和顺周期资产需要等待地产链、信用需求和 ROE 中枢重新稳定后才会真正改善。",
        "asset_performance": [
            "利率债在地产链和 ROE 下行压力下成为最稳定的受益资产。",
            "权益市场更多呈现结构性分化，高景气成长与高股息相对占优，地产链和顺周期方向承压。",
            "信用资产若缺少内生融资需求修复，难以全面走出强利差压缩行情。",
        ],
        "takeaways": [
            "房地产周期和全行业 ROE 中枢，是理解中国长期利率和债股强弱切换的重要变量。",
            "货币宽松并不自动意味着权益主升段开启，若信用需求和地产链仍弱，债券通常先行。",
        ],
        "source_report_title": "债市专题：长期利率的定价与经济周期的看法",
    },
    {
        "title": "2023年金融周期修复初期：国内股债重新定价，海外扰动仍在",
        "period": "2023",
        "regime": "宽货币 / 宽信用验证期",
        "macro_background": "2023 年初，国内市场开始围绕金融周期修复和经济边际改善重新定价，但海外仍处在高利率和衰退预期反复阶段。国内股债的核心驱动来自金融周期与经济周期，而美债和外部风险偏好更多影响节奏和估值锚。",
        "asset_performance": [
            "国内股票先对修复预期和政策脉冲作出反应，但斜率受海外扰动和盈利验证约束。",
            "利率债在宽松预期和弱复苏之间反复，体现出“债券先行、权益跟随验证”的节奏。",
            "跨市场比较中，国内资产与海外资产的定价主线出现阶段性分化。",
        ],
        "takeaways": [
            "研究国内股债行情时，应把金融周期、经济周期和海外利率环境拆开看，而不是只看单一全球风险偏好。",
            "金融周期修复早期，资产往往先交易预期，真正扩大风险预算仍要等待信用与盈利数据跟上。",
        ],
        "source_report_title": "从金融周期、经济周期看国内股、债行情",
        "chart_preview": {
            "page_number": 7,
            "label": "金融周期、经济周期与股债行情汇总",
            "image_path": "research-task/generated/external-reports/charts/2023-01-30-718f942732/page-007.png",
        },
    },
]


HISTORY_REPORT_CHART_OVERRIDES = {
    "经济周期专题：大宗商品价格简史之工业商品": {
        "page_number": 4,
        "label": "1960年以来工业大宗商品价格走势总览",
        "image_path": "research-task/generated/external-reports/charts/2023-11-03-f77f73dce7/page-004.png",
    },
    "宏观专题报告—当前所处的经济周期位置和未来资本市场展望（PPT）": {
        "page_number": 7,
        "label": "当前经济仍处在主动去库存阶段",
        "image_path": "research-task/generated/external-reports/charts/report-d560c9248e/page-007.png",
    },
}


def extract_framework_sections(markdown_text):
    lines = markdown_text.replace("\r\n", "\n").split("\n")
    current_framework = None
    current_section_title = None
    section_lines = []
    framework_sections = {value: [] for value in CHAPTER_TO_FRAMEWORK.values()}

    def flush_section():
        nonlocal current_section_title, section_lines, current_framework
        if not current_framework or not current_section_title:
            return
        content = "\n".join(section_lines).strip()
        if content:
            framework_sections[current_framework].append(
                {"title": current_section_title, "content": content}
            )
        current_section_title = None
        section_lines = []

    for raw in lines:
        line = raw.rstrip()
        if line.startswith("## "):
            flush_section()
            chapter = line[3:].strip()
            current_framework = CHAPTER_TO_FRAMEWORK.get(chapter)
            continue
        if line.startswith("### "):
            flush_section()
            if current_framework:
                title = re.sub(r"^\d+\.\d+\s*", "", line[4:].strip())
                current_section_title = title
            continue
        if current_framework and current_section_title is not None:
            section_lines.append(line)

    flush_section()
    return framework_sections


def normalize_key(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_report_title(value):
    text = normalize_key(value).lower()
    for token in [
        " ",
        "\n",
        "\t",
        "：",
        ":",
        "-",
        "_",
        "/",
        "（",
        "）",
        "(",
        ")",
        "《",
        "》",
        "“",
        "”",
        "\"",
        "'",
        "，",
        ",",
        ".",
    ]:
        text = text.replace(token, "")
    return text


def merge_unique_list(existing, additions):
    merged = list(existing or [])
    seen = {normalize_key(item) for item in merged if normalize_key(item)}
    for item in additions or []:
        key = normalize_key(item)
        if key and key not in seen:
            merged.append(item)
            seen.add(key)
    return merged


def merge_unique_text(base_text, additions):
    parts = []
    for item in [base_text, *(additions or [])]:
        text = (item or "").strip()
        if text:
            parts.append(text)
    merged = []
    seen = set()
    for text in parts:
        key = normalize_key(text)
        if key not in seen:
            merged.append(text)
            seen.add(key)
    return " ".join(merged).strip()


def merge_source_sections(existing, additions):
    merged = [dict(item) for item in (existing or [])]
    seen = {
        (normalize_key(item.get("title")), normalize_key(item.get("content")))
        for item in merged
    }
    for item in additions or []:
        key = (normalize_key(item.get("title")), normalize_key(item.get("content")))
        if any(key) and key not in seen:
            merged.append(dict(item))
            seen.add(key)
    return merged


def enrich_sections(framework_id, sections):
    enrichments = REPORT_ENRICHMENTS.get(framework_id, {})
    if not enrichments:
        return sections
    enriched = []
    for section in sections:
        section = dict(section)
        extras = enrichments.get(section["title"], [])
        if extras:
            extra_text = "\n\n" + "\n".join(f"- {item}" for item in extras)
            section["content"] = (section["content"].rstrip() + extra_text).strip()
        enriched.append(section)
    return enriched


def report_sections_to_source_sections(report_sections):
    source_sections = []
    for item in report_sections or []:
        points = item.get("points", [])
        content = "\n".join(f"- {point}" for point in points if point)
        if content:
            title = re.sub(r"^报告补强[:：]\s*", "", item.get("title", "报告补强")).strip()
            source_sections.append(
                {"title": title or "补充说明", "content": content}
            )
    return source_sections


def apply_curated_scenario_enrichments(scenarios):
    for scenario in scenarios:
        enrichments = AUTO_SCENARIO_ENRICHMENTS.get(scenario.get("title"))
        if not enrichments:
            continue
        for field in ["features", "leading_indicators", "allocation_playbook", "linked_cases"]:
            if field in enrichments:
                scenario[field] = merge_unique_list(scenario.get(field), enrichments[field])


def apply_curated_asset_enrichments(assets):
    for asset in assets:
        enrichments = AUTO_ASSET_ENRICHMENTS.get(asset.get("name"))
        if not enrichments:
            continue
        for field in ["historical_patterns", "quarterly_sorting", "report_risk_prompts"]:
            if field in enrichments:
                asset[field] = merge_unique_list(asset.get(field), enrichments[field])
        if enrichments.get("allocation_use_append"):
            asset["allocation_use"] = merge_unique_text(
                asset.get("allocation_use", ""), [enrichments["allocation_use_append"]]
            )
        if enrichments.get("china_application_append"):
            asset["china_application"] = merge_unique_text(
                asset.get("china_application", ""),
                [enrichments["china_application_append"]],
            )


def apply_curated_method_enrichments(config):
    methods = config.get("methods", [])
    for method in methods:
        enrichments = AUTO_METHOD_ENRICHMENTS.get(method.get("title"))
        if not enrichments:
            continue
        if enrichments.get("usage"):
            method["usage"] = merge_unique_list(method.get("usage"), enrichments["usage"])


def merge_curated_historical_cases(historical_cases):
    merged = [dict(item) for item in historical_cases]
    existing_titles = {normalize_key(item.get("title")) for item in merged}
    for case in AUTO_CURATED_HISTORICAL_CASES:
        title_key = normalize_key(case.get("title"))
        if title_key and title_key not in existing_titles:
            merged.append(dict(case))
            existing_titles.add(title_key)
    return merged


def build_empty_external_reports():
    return {
        "generated_at": "",
        "source_dir": "外部研究报告",
        "generator": {"script": "scripts/build_external_reports_data.py", "version": "missing"},
        "summary": {
            "report_count": 0,
            "page_count": 0,
            "chart_image_count": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "avg_seconds_per_report": 0,
            "timing": {
                "text_seconds": 0,
                "analysis_seconds": 0,
                "render_seconds": 0,
                "total_seconds": 0,
            },
            "benchmark_timing": {
                "text_seconds": 0,
                "analysis_seconds": 0,
                "render_seconds": 0,
                "total_seconds": 0,
            },
            "slowest_reports": [],
            "category_counts": {},
            "framework_counts": {},
            "new_knowledge_counts": {},
        },
        "indexes": {
            "by_framework": {},
            "by_scenario": {},
            "by_asset": {},
            "by_method": {},
            "by_history": {},
        },
        "reports": [],
    }


def get_top_reports(external_reports, index_key, title, limit=3):
    report_lookup = {
        item["id"]: item for item in external_reports.get("reports", []) if item.get("id")
    }
    report_ids = external_reports.get("indexes", {}).get(index_key, {}).get(title, [])
    reports = [report_lookup.get(report_id) for report_id in report_ids]
    reports = [item for item in reports if item]
    reports.sort(
        key=lambda item: (
            -len(item.get("highlights", [])),
            -(item.get("timing", {}) or {}).get("benchmark_total_seconds", 0),
            item.get("title", ""),
        )
    )
    return reports[:limit]


def get_reports_by_exact_title(external_reports, title, limit=3):
    if not title:
        return []
    normalized_target = normalize_report_title(title)
    reports = [
        item
        for item in external_reports.get("reports", [])
        if normalize_report_title(item.get("title")) == normalized_target
    ]
    reports.sort(
        key=lambda item: (
            -(item.get("timing", {}) or {}).get("benchmark_total_seconds", 0),
            item.get("date", ""),
        )
    )
    return reports[:limit]


def compact_report_support(report):
    return {
        "id": report.get("id"),
        "title": report.get("title"),
        "date": report.get("date"),
        "institution": report.get("institution"),
        "summary": report.get("summary"),
        "review_status": report.get("review_status"),
        "review_notes": report.get("review_notes"),
        "preferred_page_number": report.get("preferred_page_number"),
        "highlights": report.get("highlights", [])[:3],
        "new_knowledge_points": report.get("new_knowledge_points", [])[:3],
        "framework_matches": report.get("framework_matches", [])[:4],
        "scenario_matches": report.get("scenario_matches", [])[:4],
        "asset_matches": report.get("asset_matches", [])[:4],
        "method_matches": report.get("method_matches", [])[:4],
        "top_pages": report.get("top_pages", [])[:1],
        "source_pdf_path": report.get("source_pdf_path"),
        "timing": report.get("timing", {}),
    }


def build_digest_points(reports, max_points=6):
    points = []
    for report in reports:
        summary = (report.get("summary") or "").strip()
        if summary:
            points.append(f"《{report.get('title', '')}》：{summary}")
        highlights = report.get("highlights", [])[:2]
        if highlights:
            points.append("提炼：" + "；".join(highlights))
        new_knowledge = [item.get("name") for item in report.get("new_knowledge_points", [])[:2]]
        if new_knowledge:
            points.append("补入新知识点：" + "、".join(filter(None, new_knowledge)))
        if len(points) >= max_points:
            break
    return points[:max_points]


def build_digest(reports):
    if not reports:
        return None
    return {
        "report_count": len(reports),
        "points": build_digest_points(reports),
    }


def normalize_case_text(text, max_len=180):
    value = re.sub(r"\s+", " ", (text or "")).strip()
    value = re.sub(r"Bs361YGVEN85zpR.*", "", value).strip()
    if len(value) > max_len:
        value = value[: max_len - 1].rstrip() + "…"
    return value


def attach_external_support(frameworks, scenarios, assets, historical_cases, config, external_reports):
    for framework in frameworks:
        reports = get_top_reports(external_reports, "by_framework", framework["title"], 3)
        framework["external_report_support"] = [compact_report_support(item) for item in reports]

    for scenario in scenarios:
        reports = get_top_reports(external_reports, "by_scenario", scenario["title"], 3)
        scenario["external_report_support"] = [compact_report_support(item) for item in reports]

    for asset in assets:
        reports = get_top_reports(external_reports, "by_asset", asset["name"], 2)
        asset["external_report_support"] = [compact_report_support(item) for item in reports]

    for case in historical_cases:
        # Curated history cases should only show charts from explicitly assigned reports.
        # Falling back to broad history keyword matches produces misleading chart previews.
        reports = []
        if case.get("source_report_title"):
            reports = get_reports_by_exact_title(
                external_reports, case.get("source_report_title"), 2
            )
        case["external_report_support"] = [compact_report_support(item) for item in reports]
        if reports and reports[0].get("top_pages") and not case.get("chart_preview"):
            case["chart_preview"] = reports[0]["top_pages"][0]
        if reports and reports[0].get("source_pdf_path") and not case.get("source_pdf_path"):
            case["source_pdf_path"] = reports[0]["source_pdf_path"]

    methods = config.get("methods", [])
    for method in methods:
        reports = get_top_reports(external_reports, "by_method", method["title"], 2)
        method["external_report_support"] = [compact_report_support(item) for item in reports]


def derive_period_text(report):
    title = report.get("title", "") or ""
    date = report.get("date", "") or ""
    patterns = [
        r"(20\d{2}\s*[-—至]\s*20\d{2})",
        r"(20\d{2}\s*[-—至]\s*20\d{2}年)",
        r"(20\d{2}年\s*[-—至]\s*20\d{2}年)",
        r"(20\d{2})",
    ]
    for pattern in patterns:
        match = re.search(pattern, title)
        if match:
            return match.group(1).replace(" ", "")
    if date:
        return date
    return "历史专题"


def build_generated_historical_cases(external_reports, existing_titles, limit=8):
    candidates = []
    keywords = ["回顾", "历史", "以史为鉴", "战后", "错位", "简史", "比较", "周期位置"]
    for report in external_reports.get("reports", []):
        title = report.get("title", "") or ""
        if title in existing_titles:
            continue
        score = 0
        if report.get("history_matches"):
            score += 6
        if any(keyword in title for keyword in keywords):
            score += 4
        if report.get("scenario_matches"):
            score += 1
        if report.get("top_pages"):
            score += 1
        if score <= 0:
            continue
        candidates.append((score, report))

    candidates.sort(
        key=lambda item: (
            -item[0],
            -(item[1].get("timing", {}) or {}).get("benchmark_total_seconds", 0),
            item[1].get("title", ""),
        )
    )

    generated = []
    used_titles = set(existing_titles)
    for _, report in candidates:
        if len(generated) >= limit:
            break
        title = report.get("title", "")
        if title in used_titles:
            continue
        highlights = [
            normalize_case_text(item, 150)
            for item in report.get("highlights", [])
            if normalize_case_text(item, 150)
        ]
        new_knowledge = [item.get("name") for item in report.get("new_knowledge_points", []) if item.get("name")]
        summary = normalize_case_text(report.get("summary", ""), 180)
        takeaways = []
        if highlights:
            takeaways.extend(highlights[:2])
        if new_knowledge:
            takeaways.append("补充知识点：" + "、".join(new_knowledge[:2]))
        if not takeaways and summary:
            takeaways.append(summary)
        generated.append(
            {
                "title": title,
                "period": derive_period_text(report),
                "regime": " / ".join(report.get("scenario_matches", [])[:2]) or "历史专题复盘",
                "macro_background": summary or (highlights[0] if highlights else ""),
                "asset_performance": highlights[:3] or ([summary] if summary else []),
                "takeaways": takeaways[:3],
                "chart_preview": HISTORY_REPORT_CHART_OVERRIDES.get(title)
                or (report.get("top_pages") or [None])[0],
                "external_report_support": [compact_report_support(report)],
                "source_type": "external_report",
                "source_pdf_path": report.get("source_pdf_path"),
            }
        )
        used_titles.add(title)
    return generated


def parse_iso_date(value):
    try:
        return datetime.strptime(str(value), "%Y-%m-%d")
    except Exception:
        return None


def merge_unique_items(items):
    seen = set()
    output = []
    for item in items:
        text = str(item or "").strip()
        if not text or text in seen:
            continue
        seen.add(text)
        output.append(text)
    return output


def enrich_current_view_with_data(current_view, macro_dashboard):
    if not current_view or not macro_dashboard:
        return current_view

    data_view = macro_dashboard.get("data_driven_view") or {}
    cycle_cards = data_view.get("cycle_cards") or []
    if not cycle_cards:
        return current_view

    manual_path = current_view.get("current_system_path") or {}
    manual_scenario_id = manual_path.get("linked_scenario_id")
    manual_scenario_title = manual_path.get("linked_scenario_title") or "当前研究情景"
    money_card = next((item for item in cycle_cards if item.get("label") == "货币信用"), None)
    growth_card = next((item for item in cycle_cards if item.get("label") == "美林时钟"), None)
    growth_cycle_card = next((item for item in cycle_cards if item.get("label") == "增长周期"), None)
    inventory_card = next((item for item in cycle_cards if item.get("label") == "库存周期"), None)
    pring_stage = ""
    if growth_card and money_card:
        growth_scenario = growth_card.get("scenario_id")
        money_scenario = money_card.get("scenario_id")
        if growth_scenario == "growth-up-inflation-down" and money_scenario == "wide-money-wide-credit":
            pring_stage = "普林格阶段2向阶段3过渡"
        elif growth_scenario == "growth-up-inflation-up":
            pring_stage = "普林格阶段3向阶段4过渡"
        elif growth_scenario == "growth-down-inflation-up":
            pring_stage = "普林格阶段5"
        elif growth_scenario == "growth-down-inflation-down":
            pring_stage = "普林格阶段1或阶段6"

    consistency = "基本一致" if money_card and money_card.get("scenario_id") == manual_scenario_id else "存在偏差"
    summary = (
        f"数据层判断为「{growth_card.get('value', '—')} + {money_card.get('value', '—')}」，"
        f"与当前研究路径对应情景「{manual_scenario_title}」{consistency}。"
    )

    current_view["data_validation"] = {
        "status": consistency,
        "summary": summary,
        "headline": data_view.get("headline", ""),
        "evidence": (data_view.get("evidence") or [])[:4],
    }

    old_as_of = parse_iso_date(current_view.get("as_of_date"))
    new_as_of = parse_iso_date(data_view.get("as_of_date"))
    if old_as_of and new_as_of:
        current_view["as_of_date"] = max(old_as_of, new_as_of).strftime("%Y-%m-%d")
    elif new_as_of:
        current_view["as_of_date"] = new_as_of.strftime("%Y-%m-%d")

    macro_summary = str(current_view.get("macro_summary") or "").strip()
    data_summary = str(data_view.get("summary") or "").strip()
    if data_summary and data_summary not in macro_summary:
        current_view["macro_summary"] = f"{macro_summary} 数据校验层显示：{data_summary}".strip()
    else:
        current_view["macro_summary"] = macro_summary

    current_view["current_regime_labels"] = merge_unique_items(
        (current_view.get("current_regime_labels") or [])
        + (data_view.get("regime_tags") or [])
        + ([pring_stage] if pring_stage else [])
    )[:12]

    current_view["primary_frameworks_used"] = merge_unique_items(
        (current_view.get("primary_frameworks_used") or [])
        + ["普林格经济周期六段论"]
    )

    additional_drivers = [
        f"数据驱动校验：{summary}",
        growth_cycle_card.get("note") if growth_cycle_card else "",
        money_card.get("note") if money_card else "",
        inventory_card.get("note") if inventory_card else "",
        f"若用普林格经济周期六段论，当前更接近{pring_stage}，意味着债券和信用底仓仍重要，但权益已进入可逐步提高风险预算的阶段。"
        if pring_stage
        else "",
    ]
    current_view["key_drivers"] = merge_unique_items(additional_drivers + (current_view.get("key_drivers") or []))

    implication_map = {
        item.get("asset"): item
        for item in (data_view.get("implications") or [])
        if item.get("asset")
    }
    extra_implications = {
        "中国货币/现金": {
            "asset": "中国货币/现金",
            "view": "机动保留",
            "reason": "信用仍在早期修复阶段，现金仓位仍有作为波动缓冲和再平衡弹药的价值。",
            "tone": "neutral",
            "priority": 5,
        },
        "海外股票": {
            "asset": "海外股票",
            "view": "分散配置",
            "reason": "海外景气并未转弱至衰退，但更适合作为分散来源而不是主进攻方向。",
            "tone": "neutral",
            "priority": 6,
        },
        "海外债券": {
            "asset": "海外债券",
            "view": "对冲保留",
            "reason": "海外债券仍有分散价值，但美国长端利率和期限溢价限制其弹性。",
            "tone": "neutral",
            "priority": 7,
        },
        "美元/外汇": {
            "asset": "美元/外汇",
            "view": "低配保留",
            "reason": "美元和汇率对冲仍需保留，但当前不是组合主线。",
            "tone": "watch",
            "priority": 8,
        },
        "REITs/另类": {
            "asset": "REITs/另类",
            "view": "收益增强",
            "reason": "更适合作为组合增强与分散补充，而不是本轮数据驱动判断下的优先主线。",
            "tone": "neutral",
            "priority": 9,
        },
    }

    tone_map = {
        "底仓保留": "supportive",
        "结构进攻": "supportive",
        "逐步上调": "supportive",
        "黄金优先": "watch",
        "机动保留": "neutral",
        "分散配置": "neutral",
        "对冲保留": "neutral",
        "低配保留": "watch",
        "收益增强": "neutral",
    }
    priority_map = {
        "中国利率债": 1,
        "中国信用债": 2,
        "中国股票": 3,
        "中国商品/黄金": 4,
    }
    order_labels = {
        1: "优先级 1",
        2: "优先级 2",
        3: "优先级 3",
        4: "优先级 4",
        5: "优先级 5",
        6: "优先级 6",
        7: "优先级 7",
        8: "优先级 8",
        9: "优先级 9",
    }

    enriched_allocations = []
    ranking = []
    for item in current_view.get("allocation_recommendations") or []:
        asset_name = item.get("asset_name")
        implication = implication_map.get(asset_name) or extra_implications.get(asset_name) or {}
        calibration_view = implication.get("view", "待验证")
        calibration_tone = implication.get("tone") or tone_map.get(calibration_view, "neutral")
        priority = implication.get("priority") or priority_map.get(asset_name) or 99
        calibration_note = implication.get("reason", "当前数据驱动判断对该资产没有形成明确偏向，建议继续结合主观研究结论观察。")
        item["data_calibration"] = {
            "view": calibration_view,
            "tone": calibration_tone,
            "note": calibration_note,
            "priority": priority,
            "priority_label": order_labels.get(priority, "观察项"),
        }
        enriched_allocations.append(item)
        ranking.append(
            {
                "asset": asset_name,
                "priority": priority,
                "label": calibration_view,
                "tone": calibration_tone,
                "reason": calibration_note,
            }
        )
    current_view["allocation_recommendations"] = enriched_allocations
    ranking = sorted(ranking, key=lambda item: (item["priority"], item["asset"]))
    current_view["allocation_calibration"] = {
        "summary": "数据驱动排序优先考虑利率债和信用债底仓，再逐步抬升股票与黄金的观察优先级；海外资产与现金更多承担分散和机动角色。",
        "ranking": ranking,
    }

    supportive_assets = [item["asset"] for item in ranking if item["tone"] == "supportive"]
    watch_assets = [item["asset"] for item in ranking if item["tone"] == "watch"]
    grouped_assets = (supportive_assets[:2] or [item["asset"] for item in ranking[:2]])[:2]
    focus_asset = next(
        (
            item["asset"]
            for item in ranking
            if item["asset"] not in grouped_assets and item["tone"] in {"supportive", "watch"}
        ),
        ranking[2]["asset"] if len(ranking) > 2 else (ranking[0]["asset"] if ranking else ""),
    )
    data_scenario_id = (
        money_card.get("scenario_id")
        if money_card and money_card.get("scenario_id")
        else (growth_card.get("scenario_id") if growth_card else "")
    )
    data_scenario_title = (
        money_card.get("scenario_title")
        if money_card and money_card.get("scenario_title")
        else (growth_card.get("scenario_title") if growth_card else "")
    )
    path_status = "与手工路径基本一致" if consistency == "基本一致" else "与手工路径存在偏差"
    current_view["data_driven_path"] = {
        "title": "数据驱动路径建议",
        "status": path_status,
        "note": (
            f"先沿着「{data_scenario_title}」看防守与信用底仓，再评估高弹性资产的加仓节奏。"
            if data_scenario_title
            else "按当前数据环境先看底仓资产，再逐步切到高弹性资产。"
        ),
        "steps": [
            {
                "label": "数据驱动周期判断",
                "action": "tab",
                "tab": "overview",
            },
            *(
                [
                    {
                        "label": data_scenario_title,
                        "action": "scenario",
                        "scenario_id": data_scenario_id,
                        "scenario_title": data_scenario_title,
                    }
                ]
                if data_scenario_id and data_scenario_title
                else []
            ),
            {
                "label": "优先看底仓与信用修复资产",
                "action": "assets",
                "assets": grouped_assets,
            },
            *(
                [
                    {
                        "label": f"再评估：{focus_asset}",
                        "action": "asset",
                        "asset": focus_asset,
                    }
                ]
                if focus_asset
                else []
            ),
        ],
        "linked_scenario_id": data_scenario_id,
        "linked_scenario_title": data_scenario_title,
        "linked_assets": grouped_assets,
        "focus_asset": focus_asset,
    }

    manual_assets = next(
        (
            (step.get("assets") or [])
            for step in (manual_path.get("steps") or [])
            if isinstance(step, dict) and step.get("action") == "assets"
        ),
        [],
    )
    manual_focus_asset = next(
        (
            step.get("asset")
            for step in (manual_path.get("steps") or [])
            if isinstance(step, dict) and step.get("action") == "asset" and step.get("asset")
        ),
        "",
    )
    shared_assets = [asset for asset in grouped_assets if asset in manual_assets]
    only_manual_assets = [asset for asset in manual_assets if asset not in grouped_assets]
    only_data_assets = [asset for asset in grouped_assets if asset not in manual_assets]
    comparison_points = []
    if consistency == "基本一致":
        comparison_points.append(
            f"手工路径与数据路径都落在「{manual_scenario_title}」上，说明宏观情景判断方向一致。"
        )
    else:
        comparison_points.append(
            f"手工路径偏向「{manual_scenario_title}」，而数据路径更靠近「{data_scenario_title or '数据驱动情景'}」。"
        )
    if shared_assets:
        comparison_points.append(f"两条路径的共同优先资产是：{'、'.join(shared_assets)}。")
    if only_manual_assets:
        comparison_points.append(f"手工路径更强调：{'、'.join(only_manual_assets)}。")
    if only_data_assets:
        comparison_points.append(f"数据路径更强调：{'、'.join(only_data_assets)}。")
    if manual_focus_asset and focus_asset and manual_focus_asset != focus_asset:
        comparison_points.append(f"手工路径下一步聚焦 {manual_focus_asset}，而数据路径更建议先评估 {focus_asset}。")
    elif focus_asset:
        comparison_points.append(f"两条路径下一步都可以把 {focus_asset} 作为高弹性资产的主要观察对象。")

    action_hint = (
        "可以按原研究路径推进，但把数据优先资产作为先行验证层。"
        if consistency == "基本一致"
        else "应优先核对信用活化、库存确认和权益扩仓触发条件，决定是否调整手工路径。"
    )
    current_view["path_comparison"] = {
        "status": consistency,
        "headline": (
            "手工路径与数据路径当前基本同向。"
            if consistency == "基本一致"
            else "手工路径与数据路径当前存在偏离。"
        ),
        "points": comparison_points,
        "action_hint": action_hint,
        "manual_path_title": manual_path.get("title") or "当前研究导航路径",
        "data_path_title": current_view["data_driven_path"]["title"],
    }

    notes_prefix = [
        "首页已接入数据驱动周期判断，用于和原有主观研究结论做交叉验证。",
        f"数据驱动视角下，更接近「{data_view.get('headline', '')}」。",
        "资产配置建议已加入“数据校准”层，用于区分当前哪些资产是数据顺风、哪些仍需等待验证。",
        f"路径比较：{current_view['path_comparison']['headline']}{action_hint}",
    ]
    current_view["notes"] = merge_unique_items(notes_prefix + (current_view.get("notes") or []))
    return current_view


def main():
    theory_markdown = read_text(CONTENT_DIR / "macro_asset_allocation_theory.md")
    source_sections = extract_framework_sections(theory_markdown)
    frameworks = read_json("frameworks.json")
    for framework in frameworks:
        sections = source_sections.get(framework["id"], [])
        sections = enrich_sections(framework["id"], sections)
        sections = merge_source_sections(
            sections, report_sections_to_source_sections(framework.get("report_sections"))
        )
        sections = merge_source_sections(
            sections, AUTO_FRAMEWORK_SOURCE_SECTIONS.get(framework["id"], [])
        )
        if sections:
            framework["source_sections"] = sections
        framework.pop("report_sections", None)

    config = read_json("config.json")
    scenarios = read_json("macro_scenarios.json")
    assets = read_json("assets.json")
    historical_cases = merge_curated_historical_cases(read_json("historical_cases.json"))
    current_view = read_json("current_view.json")
    try:
        macro_dashboard = build_dashboard_data()
    except Exception as exc:
        macro_dashboard = read_json("macro_dashboard.json") or {
            "status": "unavailable",
            "summary": "宏观仪表盘构建失败，当前沿用兜底数据。",
            "error": str(exc),
        }
        print(f"警告: 宏观仪表盘构建失败，已跳过重建: {exc}")
    (DATA_DIR / "macro_dashboard.json").write_text(
        json.dumps(macro_dashboard, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    current_view = enrich_current_view_with_data(current_view, macro_dashboard)
    external_reports = read_json("external_reports.json") or build_empty_external_reports()
    apply_curated_scenario_enrichments(scenarios)
    apply_curated_asset_enrichments(assets)
    apply_curated_method_enrichments(config)
    attach_external_support(
        frameworks=frameworks,
        scenarios=scenarios,
        assets=assets,
        historical_cases=historical_cases,
        config=config,
        external_reports=external_reports,
    )
    historical_cases = historical_cases + build_generated_historical_cases(
        external_reports=external_reports,
        existing_titles={item.get("title") for item in historical_cases},
        limit=8,
    )

    bundle = {
        "config": config,
        "frameworks": frameworks,
        "macro_scenarios": scenarios,
        "assets": assets,
        "historical_cases": historical_cases,
        "current_view": current_view,
        "macro_dashboard": macro_dashboard,
        "external_reports": external_reports,
    }

    json_text = json.dumps(bundle, ensure_ascii=False, indent=2)
    OUTPUT_JSON.write_text(json_text + "\n", encoding="utf-8")
    OUTPUT_JS.write_text(
        "window.__MACRO_ALLOCATION_BUNDLE__ = " + json_text + ";\n",
        encoding="utf-8",
    )
    print("已生成:")
    print(OUTPUT_JSON)
    print(OUTPUT_JS)


if __name__ == "__main__":
    main()
