import { db } from '../lib/db';

const pageDefs = [
  ['home','home','Home','الرئيسية',true],
  ['about','about','About','من نحن',true],
  ['services','services','Services','الخدمات',true],
  ['projects','projects','Projects','المشاريع',true],
  ['capabilities','capabilities','Capabilities','قدرات التنفيذ',true],
  ['clients','clients','Clients','شركاء النجاح',true],
  ['contact','contact','Contact','تواصل معنا',true],
  ['privacy','legal','Privacy','الخصوصية',false],
  ['terms','legal','Terms','الشروط',false]
] as const;

const descriptions: Record<string,{en:string;ar:string}> = {
  home:{en:'Event production, exhibitions, conferences, advertising and interactive experiences.',ar:'إنتاج الفعاليات والمعارض والمؤتمرات والإعلان والتجارب التفاعلية.'},
  about:{en:'Solutions Gate combines creative innovation, strategic planning and technical execution for events and visual experiences.',ar:'تجمع بوابة الحلول بين الابتكار الإبداعي والتخطيط الاستراتيجي والتنفيذ التقني للفعاليات والتجارب البصرية.'},
  services:{en:'Event design, theater engineering, conference management, interactive technologies and advertising production services.',ar:'خدمات تصميم وإنتاج الفعاليات وهندسة المسارح وإدارة المؤتمرات والتقنيات التفاعلية والإنتاج الإعلاني.'},
  projects:{en:'A portfolio destination for verified Solutions Gate event and production work.',ar:'وجهة لعرض أعمال بوابة الحلول الموثقة في الفعاليات والإنتاج.'},
  capabilities:{en:'Verified event-execution packages and technical capabilities.',ar:'باقات تنفيذ الفعاليات والقدرات التقنية التي تم التحقق منها.'},
  clients:{en:'Client identities appear only after confirmation and public-display approval.',ar:'تظهر هويات العملاء فقط بعد التحقق والموافقة على العرض العام.'},
  contact:{en:'Contact Solutions Gate about event production, exhibitions, conferences or advertising requirements.',ar:'تواصل مع بوابة الحلول بشأن متطلبات الفعاليات والمعارض والمؤتمرات والإعلان.'},
  privacy:{en:'Privacy information.',ar:'معلومات الخصوصية.'},
  terms:{en:'Terms information.',ar:'معلومات الشروط.'}
};

type Copy={title?:string;subtitle?:string;body?:string;primaryCtaLabel?:string;secondaryCtaLabel?:string};
type SectionSeed={key:string;type:string;order:number;settings:Record<string,unknown>;en:Copy;ar:Copy;primary?:string;secondary?:string};

const sections:Record<string,SectionSeed[]>={
  home:[
    {key:'hero',type:'hero',order:10,settings:{overlay:35,textAlign:'start',mediaPosition:'background'},
      en:{subtitle:'Solutions Gate',title:'Your exceptional gateway to integrated services and pioneering solutions.',body:'We combine creative innovation with strategic planning to transform ambitious ideas into tangible visual and technical experiences.',primaryCtaLabel:'Explore our services',secondaryCtaLabel:'Contact us'},
      ar:{subtitle:'بوابة الحلول للفعاليات',title:'بوابتك الاستثنائية نحو خدمات متكاملة وحلول رائدة.',body:'نجمع بين الابتكار الإبداعي وعمق التخطيط الاستراتيجي لنحوّل الأفكار الطموحة إلى تجارب بصرية وتقنية ملموسة.',primaryCtaLabel:'استكشف خدماتنا',secondaryCtaLabel:'تواصل معنا'},primary:'services',secondary:'contact'},
    {key:'metrics',type:'metrics',order:20,settings:{maxItems:3},en:{title:'Our strength in numbers'},ar:{title:'قوتنا في الأرقام'}},
    {key:'who-we-are',type:'intro',order:30,settings:{layout:'split',mediaPosition:'end'},en:{subtitle:'Who we are',title:'Creative ideas, engineered into real experiences.',body:'Solutions Gate operates in advertising, publicity, exhibitions and conferences, and in the design and production of luxury events and artistic presentations.'},ar:{subtitle:'من نحن',title:'أفكار إبداعية تتحول إلى تجارب حقيقية مدروسة.',body:'تعمل بوابة الحلول في مجالات الإعلان والدعاية وتنظيم المعارض والمؤتمرات وتصميم وإنتاج الفعاليات الفاخرة والعروض الفنية.'}},
    {key:'featured-services',type:'featuredServices',order:40,settings:{maxItems:6},en:{title:'Integrated event-production services',body:'From concept and engineering to technical production and on-site execution.'},ar:{title:'خدمات متكاملة لإنتاج الفعاليات',body:'من الفكرة والهندسة إلى الإنتاج التقني والتنفيذ الميداني.'}},
    {key:'why-solutions-gate',type:'intro',order:50,settings:{layout:'split',mediaPosition:'start'},en:{subtitle:'Our identity and enduring values',title:'Innovation with production precision.',body:'We combine innovative advertising with production precision in print and event setups, setting new standards for refined experiences in the Middle East.'},ar:{subtitle:'هويتنا وقيمنا الراسخة',title:'ابتكار مدعوم بدقة الإنتاج.',body:'نجمع بين الإعلان المبتكر ودقة الإنتاج في المطبوعات وتجهيزات الفعاليات لنقدم تجارب راقية بمعايير احترافية.'}},
    {key:'work-cycle',type:'workCycle',order:60,settings:{layout:'desktop-horizontal'},en:{title:'From idea to implementation',body:'A five-stage work cycle built around clarity, design readiness and field execution.'},ar:{title:'من الفكرة إلى التنفيذ',body:'دورة عمل من خمس مراحل تبدأ بالمتطلبات وتنتهي بالتنفيذ والمتابعة الميدانية.'}},
    {key:'featured-projects',type:'featuredProjects',order:70,settings:{maxItems:6},en:{title:'Selected work'},ar:{title:'نماذج من أعمالنا'}},
    {key:'visual-future',type:'technologyFeature',order:80,settings:{mediaPosition:'start',themeVariant:'dark'},en:{subtitle:'3D visual effects',title:'A production that challenges the visual future.',body:'We use interactive holograms, smart displays, digital theatrical-lighting control and advanced audiovisual technologies to create immersive spaces and memorable effects.'},ar:{subtitle:'المؤثرات البصرية ثلاثية الأبعاد',title:'إنتاج يتحدى مستقبل الصورة.',body:'نوظف الهولوغرام التفاعلي والشاشات الذكية والتحكم الرقمي في الإضاءة المسرحية وتقنيات الصوت والصورة المتقدمة لصناعة مساحات تفاعلية ومؤثرات لافتة.'}},
    {key:'clients',type:'clients',order:90,settings:{maxItems:18},en:{title:'Partners in success'},ar:{title:'شركاء النجاح'}},
    {key:'final-cta',type:'cta',order:100,settings:{alignment:'center',themeVariant:'purple'},en:{title:'Are you ready to get started?',body:'Let us create the next exceptional event for your business together.',primaryCtaLabel:'Contact us'},ar:{title:'هل أنت مستعد للبدء؟',body:'دعنا نصنع معاً الفعالية الاستثنائية القادمة لأعمالك.',primaryCtaLabel:'تواصل معنا'},primary:'contact'}
  ],
  about:[
    {key:'hero',type:'hero',order:10,settings:{overlay:25,textAlign:'start',mediaPosition:'background'},en:{subtitle:'About Solutions Gate',title:'A gateway opening horizons of visual excellence.'},ar:{subtitle:'عن بوابة الحلول',title:'بوابة تفتح آفاق التميز البصري.'}},
    {key:'who-we-are',type:'intro',order:20,settings:{layout:'split',mediaPosition:'end'},en:{title:'Who are we?',body:'We operate in advertising, publicity and the organization of exhibitions and conferences. We are active in the design and production of luxury events and artistic presentations, combining innovation with strategic planning.'},ar:{title:'من نحن؟',body:'نعمل في مجالات الإعلان والدعاية وتنظيم المعارض والمؤتمرات وتصميم وإنتاج الفعاليات الفاخرة والعروض الفنية، ونجمع بين الابتكار والتخطيط الاستراتيجي.'}},
    {key:'vision',type:'richText',order:30,settings:{maxWidth:'prose',themeVariant:'light'},en:{title:'Our Strategic Vision',body:'To be a premier gateway and trusted partner in the Middle East for executing luxury events and major conferences, inspiring partners through advanced technical solutions and lasting visual impact.'},ar:{title:'رؤيتنا الاستراتيجية',body:'أن نكون بوابة رائدة وشريكاً موثوقاً في الشرق الأوسط لتنفيذ الفعاليات الفاخرة والمؤتمرات الكبرى عبر حلول تقنية متقدمة وأثر بصري مستدام.'}},
    {key:'mission-values',type:'richText',order:40,settings:{maxWidth:'prose',themeVariant:'muted'},en:{title:'Our Mission and Values',body:'We pursue high professional and engineering standards through technical innovation, transparency, attention to fine detail and operational speed.'},ar:{title:'رسالتنا وقيمنا',body:'نلتزم بالمعايير المهنية والهندسية العالية من خلال الابتكار التقني والشفافية والاهتمام بأدق التفاصيل وسرعة التنفيذ.'}},
    {key:'identity',type:'richText',order:50,settings:{maxWidth:'wide',themeVariant:'light'},en:{title:'Our Identity and Enduring Values',body:'We combine innovative advertising with production precision in print and event setups, with a focus on refined, high-quality experiences.'},ar:{title:'هويتنا وقيمنا الراسخة',body:'نجمع بين الإعلان المبتكر ودقة الإنتاج في المطبوعات وتجهيزات الفعاليات مع التركيز على التجارب الراقية عالية الجودة.'}},
    {key:'work-cycle',type:'workCycle',order:60,settings:{layout:'desktop-horizontal'},en:{title:'Our work cycle'},ar:{title:'دورة العمل'}},
    {key:'metrics',type:'metrics',order:70,settings:{maxItems:3},en:{title:'Our strength in numbers'},ar:{title:'قوتنا في الأرقام'}},
    {key:'leadership',type:'leadership',order:80,settings:{maxItems:1},en:{title:'Message from Executive Management'},ar:{title:'كلمة الإدارة التنفيذية'}},
    {key:'cta',type:'cta',order:90,settings:{alignment:'center',themeVariant:'purple'},en:{title:'Build the next moment with us',primaryCtaLabel:'Contact us'},ar:{title:'اصنع اللحظة القادمة معنا',primaryCtaLabel:'تواصل معنا'},primary:'contact'}
  ],
  services:[
    {key:'hero',type:'hero',order:10,settings:{overlay:25,textAlign:'start',mediaPosition:'background'},en:{title:'Integrated services. Pioneering solutions.',body:'Event production, stage engineering, conference management, interactive technology and advertising production.'},ar:{title:'خدمات متكاملة. حلول رائدة.',body:'إنتاج الفعاليات وهندسة المسارح وإدارة المؤتمرات والتقنيات التفاعلية والإنتاج الإعلاني.'}},
    {key:'intro',type:'intro',order:20,settings:{layout:'stacked',mediaPosition:'end'},en:{title:'Our services',body:'A structured view of the event-production and advertising capabilities supported by the company profile.'},ar:{title:'خدماتنا',body:'عرض منظم لقدرات إنتاج الفعاليات والإعلان المدعومة بملف الشركة.'}},
    {key:'service-index',type:'serviceIndex',order:30,settings:{grouping:'category'},en:{title:'Explore our service portfolio'},ar:{title:'استكشف منظومة خدماتنا'}},
    {key:'technology',type:'technologyFeature',order:40,settings:{mediaPosition:'end',themeVariant:'dark'},en:{title:'Interactive technologies and visual innovation',body:'Holograms, smart displays, theatrical-lighting control and immersive audiovisual environments.'},ar:{title:'تقنيات تفاعلية وابتكار بصري',body:'الهولوغرام والشاشات الذكية والتحكم بالإضاءة المسرحية والبيئات السمعية والبصرية الغامرة.'}},
    {key:'work-cycle',type:'workCycle',order:50,settings:{layout:'desktop-horizontal'},en:{title:'How we work'},ar:{title:'كيف نعمل'}},
    {key:'cta',type:'cta',order:60,settings:{alignment:'center',themeVariant:'purple'},en:{title:'Discuss your event requirements',primaryCtaLabel:'Contact us'},ar:{title:'ناقش متطلبات فعاليتك',primaryCtaLabel:'تواصل معنا'},primary:'contact'}
  ],
  projects:[
    {key:'hero',type:'hero',order:10,settings:{overlay:20,textAlign:'start',mediaPosition:'background'},en:{title:'Highlights of our work',body:'Named project records are published only when their details are verified.'},ar:{title:'نماذج من أعمالنا',body:'لا تُنشر سجلات المشاريع المسماة إلا بعد التحقق من تفاصيلها.'}},
    {key:'project-index',type:'projectIndex',order:20,settings:{columns:3,filterMode:'category'},en:{title:'Projects'},ar:{title:'المشاريع'}},
    {key:'cta',type:'cta',order:30,settings:{alignment:'center',themeVariant:'purple'},en:{title:'Planning your next event?',primaryCtaLabel:'Contact us'},ar:{title:'تخطط لفعاليتك القادمة؟',primaryCtaLabel:'تواصل معنا'},primary:'contact'}
  ],
  capabilities:[
    {key:'hero',type:'hero',order:10,settings:{overlay:20,textAlign:'start',mediaPosition:'background'},en:{title:'Event execution standards',body:'Compare the currently verified event-execution package content.'},ar:{title:'معايير تنفيذ الفعاليات',body:'قارن محتوى باقات تنفيذ الفعاليات التي تم التحقق منها حالياً.'}},
    {key:'intro',type:'intro',order:20,settings:{layout:'stacked',mediaPosition:'end'},en:{title:'Designed around execution needs',body:'Package labels and values follow the source material; unresolved English labels remain unpublished.'},ar:{title:'مصممة بحسب احتياجات التنفيذ',body:'تتبع أسماء الباقات وقيمها المصدر، وتبقى التسميات الإنجليزية غير المحسومة غير منشورة.'}},
    {key:'comparison',type:'capabilityComparison',order:30,settings:{mobileMode:'stacked',showLegend:false},en:{title:'Service & advantage comparison'},ar:{title:'مقارنة الخدمات والمزايا'}},
    {key:'cta',type:'cta',order:40,settings:{alignment:'center',themeVariant:'purple'},en:{title:'Need a tailored execution scope?',primaryCtaLabel:'Contact us'},ar:{title:'تحتاج نطاق تنفيذ مخصصاً؟',primaryCtaLabel:'تواصل معنا'},primary:'contact'}
  ],
  clients:[
    {key:'hero',type:'hero',order:10,settings:{overlay:20,textAlign:'start',mediaPosition:'background'},en:{title:'Partners in success',body:'Client identities appear here only after identity and public-display approval.'},ar:{title:'شركاء النجاح',body:'تظهر هويات العملاء هنا فقط بعد التحقق والموافقة على العرض العام.'}},
    {key:'intro',type:'intro',order:20,settings:{layout:'stacked',mediaPosition:'end'},en:{title:'Strategic client relationships',body:'The profile includes a client-logo grid; individual identities remain gated until approved for public display.'},ar:{title:'علاقات مع عملاء استراتيجيين',body:'يتضمن ملف الشركة شبكة لشعارات العملاء، وتبقى الهويات الفردية محجوبة حتى اعتماد عرضها العام.'}},
    {key:'client-grid',type:'clients',order:30,settings:{maxItems:30},en:{title:'Approved client identities'},ar:{title:'هويات العملاء المعتمدة'}},
    {key:'cta',type:'cta',order:40,settings:{alignment:'center',themeVariant:'purple'},en:{title:'Let us build the next success together',primaryCtaLabel:'Contact us'},ar:{title:'لنصنع النجاح القادم معاً',primaryCtaLabel:'تواصل معنا'},primary:'contact'}
  ],
  contact:[
    {key:'hero',type:'hero',order:10,settings:{overlay:20,textAlign:'start',mediaPosition:'background'},en:{title:'Are you ready to get started?',body:'Let us create the next exceptional event for your business together.'},ar:{title:'هل أنت مستعد للبدء؟',body:'دعنا نصنع معاً الفعالية الاستثنائية القادمة لأعمالك.'}},
    {key:'contact-details',type:'contactDetails',order:20,settings:{layout:'cards'},en:{title:'Contact our team'},ar:{title:'تواصل مع فريقنا'}},
    {key:'contact-form',type:'contactForm',order:30,settings:{formVariant:'base'},en:{title:'Send an inquiry',body:'Share the essentials and our team can respond using the contact details you provide.'},ar:{title:'أرسل استفسارك',body:'شارك المعلومات الأساسية ليتمكن فريقنا من الرد باستخدام بيانات التواصل التي تقدمها.'}}
  ]
};

const categories=[
  {slug:'event-production',order:10,en:'Event Production & Management',ar:'إنتاج وإدارة الفعاليات',enDesc:'Event design, stages, conferences and technical production.',arDesc:'تصميم الفعاليات والمسارح والمؤتمرات والإنتاج التقني.'},
  {slug:'advertising-publicity',order:20,en:'Advertising & Publicity',ar:'الإعلان والدعاية',enDesc:'Promotional materials, uniforms, signage and print/digital production.',arDesc:'المواد الترويجية والزي الموحد واللافتات والإنتاج الطباعي والرقمي.'}
] as const;

const serviceData=[
  ['event-design-production','event-production',10,true,'Event Design and Production','تصميم وإنتاج الفعاليات','Exceptional visual concepts transformed into fully realized event experiences.','مفاهيم بصرية استثنائية تتحول إلى تجارب فعالية متكاملة.','We innovate exceptional visual concepts and transform inspiring ideas into fully realized, creative scenarios that pulse with life, creating a unique, memorable sensory experience for the audience.','نبتكر مفاهيم بصرية استثنائية ونحوّل الأفكار الملهمة إلى سيناريوهات إبداعية متكاملة تنبض بالحياة وتصنع تجربة حسية مميزة للجمهور.'],
  ['theater-engineering-construction','event-production',20,true,'Theater Engineering and Construction','هندسة وإنشاء المسارح','Stages, exhibition platforms and architectural structures with professional sound and cinematic lighting.','مسارح ومنصات وهياكل معمارية مدعومة بالصوت الاحترافي والإضاءة السينمائية.','We construct exhibition platforms, massive stages, and complex architectural structures equipped with professional sound and cinematic lighting systems that captivate the eye.','ننفذ منصات المعارض والمسارح الكبيرة والهياكل المعمارية المعقدة المجهزة بأنظمة صوت احترافية وإضاءة سينمائية تلفت الأنظار.'],
  ['event-conference-management','event-production',30,true,'Event and Conference Management','إدارة الفعاليات والمؤتمرات','Operational planning for conferences, exhibitions, protocols, invitations and crowd flow.','تخطيط تشغيلي للمؤتمرات والمعارض والبروتوكولات والدعوات وحركة الحشود.','Comprehensive operational planning for major conferences and exhibitions, from invitations and official protocols to crowd flow and on-site operations.','تخطيط تشغيلي متكامل للمؤتمرات والمعارض الكبرى، من إدارة الدعوات والبروتوكولات الرسمية إلى تنظيم تدفق الحشود والعمليات الميدانية.'],
  ['interactive-technologies-innovation','event-production',40,true,'Interactive Technologies and Innovation','التقنيات التفاعلية والابتكار','Augmented reality, holograms, smart displays and immersive audiovisual environments.','الواقع المعزز والهولوغرام والشاشات الذكية والبيئات السمعية والبصرية الغامرة.','We integrate augmented reality, hologram technology and smart interactive displays to create technology-driven events and immersive visual experiences.','ندمج الواقع المعزز وتقنيات الهولوغرام والشاشات التفاعلية الذكية لصناعة فعاليات وتجارب بصرية غامرة مدفوعة بالتقنية.'],
  ['ceremonies-grand-openings','event-production',50,true,'Ceremonies and Grand Openings','الحفلات والافتتاحات الكبرى','Special events, official inaugurations and protocol-focused execution.','الفعاليات الخاصة والافتتاحات الرسمية والتنفيذ الدقيق للبروتوكولات.','We manage public and private corporate events, major institutional functions and official inaugurations with comprehensive execution and protocol coordination.','ندير الفعاليات العامة والخاصة للشركات والمناسبات المؤسسية الكبرى والافتتاحات الرسمية بتنفيذ متكامل وتنسيق للبروتوكولات.'],
  ['promotional-gifts','advertising-publicity',60,true,'Luxury Promotional Gifts','الهدايا الترويجية الفاخرة','Premium promotional gifts aligned with the client visual identity.','هدايا ترويجية فاخرة متوافقة مع الهوية البصرية للعميل.','We conceive, design and craft premium promotional gifts tailored to align with the visual identity, combining refined materials with creative solutions.','نبتكر ونصمم وننفذ هدايا ترويجية فاخرة مصممة لتنسجم مع الهوية البصرية، مع الجمع بين المواد الراقية والحلول الإبداعية.'],
  ['uniforms','advertising-publicity',70,false,'Event Uniforms','الزي الموحد للفعاليات','Custom uniforms for organization, reception, technical and field teams.','زي موحد مخصص لفرق التنظيم والاستقبال والفرق التقنية والميدانية.','We design and manufacture high-quality custom uniforms for event organization, reception, technical and field logistics teams, aligning color and embroidery with the event visual identity.','نصمم وننفذ زياً موحداً عالي الجودة لفرق تنظيم الفعاليات والاستقبال والفرق التقنية واللوجستية الميدانية، مع مواءمة الألوان والتطريز مع الهوية البصرية للفعالية.'],
  ['signage-wayfinding','advertising-publicity',80,false,'Billboards and Wayfinding Signs','اللوحات الإعلانية والإرشادية','Advertising, corporate and wayfinding signage with architectural lighting.','لوحات إعلانية ومؤسسية وإرشادية مدعومة بالإضاءة المعمارية.','We design, fabricate and install advertising and wayfinding signage for commercial, healthcare and corporate settings using architectural lighting and LED or neon technologies where appropriate.','نصمم ونصنع ونركب اللوحات الإعلانية والإرشادية للمنشآت التجارية والصحية والشركات مع توظيف الإضاءة المعمارية وتقنيات LED والنيون عند الحاجة.'],
  ['print-digital-media','advertising-publicity',90,false,'Print and Digital Media','المطبوعات والمواد الرقمية','Event booklets, agendas, VIP cards and premium promotional publications.','كتيبات الفعاليات والأجندات وبطاقات كبار الشخصيات والمنشورات الترويجية الراقية.','We provide print and digital production for event booklets, agendas, VIP cards and promotional brochures, with attention to premium paper stocks, finishing and consistent visual presentation.','نوفر إنتاج المطبوعات والمواد الرقمية لكتيبات الفعاليات والأجندات وبطاقات كبار الشخصيات والمنشورات الترويجية، مع الاهتمام بالخامات والتشطيبات الراقية والاتساق البصري.']
] as const;

const featureData:Record<string,Array<[string,string]>>={
  'event-conference-management':[['Invitation management','إدارة الدعوات'],['Official protocols','البروتوكولات الرسمية'],['Crowd and on-site operations','إدارة الحشود والعمليات الميدانية']],
  'theater-engineering-construction':[['Exhibition platforms and stages','منصات المعارض والمسارح'],['Professional sound systems','أنظمة الصوت الاحترافية'],['Cinematic lighting','الإضاءة السينمائية']],
  'interactive-technologies-innovation':[['Interactive holograms','الهولوغرام التفاعلي'],['Smart displays','الشاشات الذكية'],['Digital theatrical-lighting control','التحكم الرقمي بالإضاءة المسرحية']]
};

const processData=[
 ['idea','01','Idea','الفكرة','Your request reaches us, and we turn it into a clear idea that meets your goals.','يصلنا طلبك ونحوّله إلى فكرة واضحة تلبي أهدافك.'],
 ['plan','02','Plan','الخطة','We prepare a comprehensive implementation plan that includes every detail and defines all tasks.','نعد خطة تنفيذ شاملة تتضمن كل التفاصيل وتحدد جميع المهام.'],
 ['design','03','Design','التصميم','We transform ideas into professional 3D designs.','نحوّل الأفكار إلى تصاميم ثلاثية الأبعاد احترافية.'],
 ['supply','04','Supply','التوريد','After design approval, we prepare all equipment and required materials and ensure their readiness.','بعد اعتماد التصميم، نجهز جميع المعدات والمواد المطلوبة ونتأكد من جاهزيتها.'],
 ['implementation','05','Implementation','التنفيذ','We supervise and follow up on every stage of execution to ensure the highest quality standards.','نشرف ونتابع كل مرحلة من مراحل التنفيذ لضمان أعلى معايير الجودة.']
] as const;

const capabilityData=[
 ['stage-engineering',10,'Stage Engineering Systems','أنظمة هندسة المسارح','Integrated standard operating theaters','مسارح تشغيل قياسية متكاملة','Curved structures and 3D designs','هياكل منحنية وتصاميم ثلاثية الأبعاد'],
 ['lighting-sound',20,'Lighting and sound equipment','معدات الإضاءة والصوت','Professional lighting and audio coverage','تغطية احترافية للإضاءة والصوت','Cinematic lighting and surround sound distribution','إضاءة سينمائية وتوزيع صوت محيطي'],
 ['virtual-interactive',30,'Virtual and Interactive Reality','الواقع الافتراضي والتفاعلي','Standard smart display screens','شاشات عرض ذكية قياسية','Interactive screens with attendance tracking systems','شاشات تفاعلية مع أنظمة تتبع الحضور'],
 ['crowd-planning',40,'Crowd Planning and Management','تخطيط وإدارة الحشود','Management and coordination of the basic protocol','إدارة وتنسيق البروتوكول الأساسي','Full electronic control and smart gates for members','تحكم إلكتروني كامل وبوابات ذكية للأعضاء']
] as const;

async function seedPages(){
 const map=new Map<string,string>();
 for(const [slug,template,en,ar,publish] of pageDefs){
  const page=await db.page.upsert({where:{slug},update:{template,status:publish?'PUBLISHED':'DRAFT',publishedAt:publish?new Date():null},create:{slug,template,status:publish?'PUBLISHED':'DRAFT',publishedAt:publish?new Date():null}});
  map.set(slug,page.id);
  for(const locale of ['en','ar'] as const){
   const title=locale==='en'?en:ar;
   await db.pageTranslation.upsert({where:{pageId_locale:{pageId:page.id,locale}},update:{title,navigationLabel:title,summary:descriptions[slug][locale]},create:{pageId:page.id,locale,title,navigationLabel:title,summary:descriptions[slug][locale]}});
   await db.seoMetadata.upsert({where:{ownerType_ownerId_locale:{ownerType:'Page',ownerId:page.id,locale}},update:{title,description:descriptions[slug][locale]},create:{ownerType:'Page',ownerId:page.id,locale,title,description:descriptions[slug][locale]}});
  }
 }
 for(const [pageSlug,list] of Object.entries(sections)){
  const pageId=map.get(pageSlug)!;
  for(const item of list){
   const section=await db.pageSection.upsert({where:{pageId_key:{pageId,key:item.key}},update:{sectionType:item.type,sortOrder:item.order,enabled:true,settingsVersion:1,settingsJson:item.settings,primaryCtaPageId:item.primary?map.get(item.primary):null,secondaryCtaPageId:item.secondary?map.get(item.secondary):null},create:{pageId,key:item.key,sectionType:item.type,sortOrder:item.order,enabled:true,settingsVersion:1,settingsJson:item.settings,primaryCtaPageId:item.primary?map.get(item.primary):null,secondaryCtaPageId:item.secondary?map.get(item.secondary):null}});
   for(const locale of ['en','ar'] as const){const copy=item[locale];await db.pageSectionTranslation.upsert({where:{sectionId_locale:{sectionId:section.id,locale}},update:copy,create:{sectionId:section.id,locale,...copy}});}
  }
 }
 return map;
}

async function seedNav(map:Map<string,string>){
 const main=await db.navigationMenu.upsert({where:{key:'main'},update:{enabled:true},create:{key:'main',enabled:true}});
 const footer=await db.navigationMenu.upsert({where:{key:'footer'},update:{enabled:true},create:{key:'footer',enabled:true}});
 await db.navigationItem.deleteMany({where:{menuId:{in:[main.id,footer.id]}}});
 for(const [slug,order] of [['home',10],['about',20],['services',30],['contact',40]] as const){const def=pageDefs.find((x)=>x[0]===slug)!;await db.navigationItem.create({data:{menuId:main.id,internalPageId:map.get(slug),sortOrder:order,enabled:true,translations:{create:[{locale:'en',label:def[2]},{locale:'ar',label:def[3]}]}}});}
 for(const [slug,order] of [['about',10],['services',20],['contact',30]] as const){const def=pageDefs.find((x)=>x[0]===slug)!;await db.navigationItem.create({data:{menuId:footer.id,internalPageId:map.get(slug),sortOrder:order,enabled:true,translations:{create:[{locale:'en',label:def[2]},{locale:'ar',label:def[3]}]}}});}
}

async function seedServices(){
 const ids=new Map<string,string>();
 for(const c of categories){const row=await db.serviceCategory.upsert({where:{slug:c.slug},update:{sortOrder:c.order,enabled:true},create:{slug:c.slug,sortOrder:c.order,enabled:true}});ids.set(c.slug,row.id);await db.serviceCategoryTranslation.upsert({where:{categoryId_locale:{categoryId:row.id,locale:'en'}},update:{name:c.en,shortDescription:c.enDesc},create:{categoryId:row.id,locale:'en',name:c.en,shortDescription:c.enDesc}});await db.serviceCategoryTranslation.upsert({where:{categoryId_locale:{categoryId:row.id,locale:'ar'}},update:{name:c.ar,shortDescription:c.arDesc},create:{categoryId:row.id,locale:'ar',name:c.ar,shortDescription:c.arDesc}});}
 for(const [slug,category,order,featured,en,ar,enShort,arShort,enBody,arBody] of serviceData){const row=await db.service.upsert({where:{slug},update:{categoryId:ids.get(category)!,sortOrder:order,featured,status:'PUBLISHED',publishedAt:new Date()},create:{slug,categoryId:ids.get(category)!,sortOrder:order,featured,status:'PUBLISHED',publishedAt:new Date()}});await db.serviceTranslation.upsert({where:{serviceId_locale:{serviceId:row.id,locale:'en'}},update:{name:en,shortDescription:enShort,detailedContent:enBody},create:{serviceId:row.id,locale:'en',name:en,shortDescription:enShort,detailedContent:enBody}});await db.serviceTranslation.upsert({where:{serviceId_locale:{serviceId:row.id,locale:'ar'}},update:{name:ar,shortDescription:arShort,detailedContent:arBody},create:{serviceId:row.id,locale:'ar',name:ar,shortDescription:arShort,detailedContent:arBody}});await db.serviceFeature.deleteMany({where:{serviceId:row.id}});for(const [i,[fe,fa]] of (featureData[slug]??[]).entries()){await db.serviceFeature.create({data:{serviceId:row.id,sortOrder:i*10,enabled:true,translations:{create:[{locale:'en',title:fe},{locale:'ar',title:fa}]}}});}}
}

async function seedProcess(){for(const [i,[key,number,en,ar,enDesc,arDesc]] of processData.entries()){const row=await db.processStep.upsert({where:{key},update:{number,sortOrder:(i+1)*10,enabled:true},create:{key,number,sortOrder:(i+1)*10,enabled:true}});await db.processStepTranslation.upsert({where:{processStepId_locale:{processStepId:row.id,locale:'en'}},update:{title:en,description:enDesc},create:{processStepId:row.id,locale:'en',title:en,description:enDesc}});await db.processStepTranslation.upsert({where:{processStepId_locale:{processStepId:row.id,locale:'ar'}},update:{title:ar,description:arDesc},create:{processStepId:row.id,locale:'ar',title:ar,description:arDesc}});}}

async function seedMetrics(){const data=[['150+','Established projects','مشروعاً منفذاً','Profile p12 projects claim; owner reconfirmation required.'],['98%','Customer and strategic partner satisfaction rate','معدل رضا العملاء والشركاء الاستراتيجيين','Profile p12 satisfaction claim; owner reconfirmation required.'],['150,000+','Visitors managed per individual event','زائر تتم إدارة حشودهم في الفعالية الواحدة','Profile p12 crowd claim; owner reconfirmation required.']] as const;for(const [i,[value,en,ar,note]] of data.entries()){let row=await db.metric.findFirst({where:{sourceNote:note}});row=row?await db.metric.update({where:{id:row.id},data:{displayValue:value,sortOrder:i*10,enabled:false,lastConfirmedAt:null}}):await db.metric.create({data:{displayValue:value,sortOrder:i*10,enabled:false,sourceNote:note}});await db.metricTranslation.upsert({where:{metricId_locale:{metricId:row.id,locale:'en'}},update:{label:en},create:{metricId:row.id,locale:'en',label:en}});await db.metricTranslation.upsert({where:{metricId_locale:{metricId:row.id,locale:'ar'}},update:{label:ar},create:{metricId:row.id,locale:'ar',label:ar}});}}

async function seedCapabilities(){
 const core=await db.capabilityPackage.upsert({where:{key:'core'},update:{sortOrder:10,enabled:true,needsOwnerLabel:false},create:{key:'core',sortOrder:10,enabled:true,needsOwnerLabel:false}});
 const advanced=await db.capabilityPackage.upsert({where:{key:'advanced'},update:{sortOrder:20,enabled:true,needsOwnerLabel:false},create:{key:'advanced',sortOrder:20,enabled:true,needsOwnerLabel:false}});
 const unresolved=await db.capabilityPackage.upsert({where:{key:'premium-unresolved'},update:{sortOrder:30,enabled:false,needsOwnerLabel:true},create:{key:'premium-unresolved',sortOrder:30,enabled:false,needsOwnerLabel:true}});
 for(const [pkg,en,ar] of [[core,'Core Events Package','باقة الفعاليات الأساسية'],[advanced,'Advanced Events Package','باقة الفعاليات المتقدمة'],[unresolved,'Information required from business owner','الحلول الملكية والاستثنائية']] as const){await db.capabilityPackageTranslation.upsert({where:{capabilityPackageId_locale:{capabilityPackageId:pkg.id,locale:'en'}},update:{name:en},create:{capabilityPackageId:pkg.id,locale:'en',name:en}});await db.capabilityPackageTranslation.upsert({where:{capabilityPackageId_locale:{capabilityPackageId:pkg.id,locale:'ar'}},update:{name:ar},create:{capabilityPackageId:pkg.id,locale:'ar',name:ar}});}
 for(const [key,order,en,ar,coreEn,coreAr,advEn,advAr] of capabilityData){const f=await db.capabilityFeature.upsert({where:{key},update:{sortOrder:order,enabled:true},create:{key,sortOrder:order,enabled:true}});await db.capabilityFeatureTranslation.upsert({where:{capabilityFeatureId_locale:{capabilityFeatureId:f.id,locale:'en'}},update:{name:en},create:{capabilityFeatureId:f.id,locale:'en',name:en}});await db.capabilityFeatureTranslation.upsert({where:{capabilityFeatureId_locale:{capabilityFeatureId:f.id,locale:'ar'}},update:{name:ar},create:{capabilityFeatureId:f.id,locale:'ar',name:ar}});for(const [pkg,ve,va,enabled] of [[core,coreEn,coreAr,true],[advanced,advEn,advAr,true],[unresolved,'Information required from business owner','معلومة مطلوبة من مالك النشاط',false]] as const){const v=await db.capabilityValue.upsert({where:{capabilityPackageId_capabilityFeatureId:{capabilityPackageId:pkg.id,capabilityFeatureId:f.id}},update:{valueKind:'TEXT',enabled},create:{capabilityPackageId:pkg.id,capabilityFeatureId:f.id,valueKind:'TEXT',enabled}});await db.capabilityValueTranslation.upsert({where:{capabilityValueId_locale:{capabilityValueId:v.id,locale:'en'}},update:{content:ve},create:{capabilityValueId:v.id,locale:'en',content:ve}});await db.capabilityValueTranslation.upsert({where:{capabilityValueId_locale:{capabilityValueId:v.id,locale:'ar'}},update:{content:va},create:{capabilityValueId:v.id,locale:'ar',content:va}});}}
}

async function seedPeople(){
 let leader=await db.leadershipMember.findFirst({where:{translations:{some:{locale:'en',name:'Sultan Hijazi'}}}});
 if(!leader)leader=await db.leadershipMember.create({data:{sortOrder:10,status:'PUBLISHED'}});
 await db.leadershipMember.update({where:{id:leader.id},data:{sortOrder:10,status:'PUBLISHED'}});
 const en='The success of any major event lies in exceptional attention to the finest details and the ability to blend architectural elegance with technological innovation. At Solutions Gate, we do more than just organize events; we create immersive experiences that exceed expectations and leave an indelible mark on the hearts of attendees. We are proud to be your first choice for building the moments of a bright future.';
 const ar='إن نجاح أي فعالية كبرى يكمن في الاهتمام الاستثنائي بأدق التفاصيل والقدرة على دمج الفخامة المعمارية بالابتكار التكنولوجي. في بوابة الحلول لا نقوم بتنظيم الفعاليات فحسب، بل نصنع تجارب حية تتجاوز التوقعات وتترك أثراً لا يُمحى في قلوب الحاضرين. نفخر بأن نكون خياركم لبناء لحظات المستقبل المشرق.';
 await db.leadershipMemberTranslation.upsert({where:{leadershipMemberId_locale:{leadershipMemberId:leader.id,locale:'en'}},update:{name:'Sultan Hijazi',title:'CEO',biographyOrMessage:en},create:{leadershipMemberId:leader.id,locale:'en',name:'Sultan Hijazi',title:'CEO',biographyOrMessage:en}});
 await db.leadershipMemberTranslation.upsert({where:{leadershipMemberId_locale:{leadershipMemberId:leader.id,locale:'ar'}},update:{name:'سلطان حجازي',title:'الرئيس التنفيذي',biographyOrMessage:ar},create:{leadershipMemberId:leader.id,locale:'ar',name:'سلطان حجازي',title:'الرئيس التنفيذي',biographyOrMessage:ar}});
 await db.contactPerson.deleteMany();
 await db.contactPerson.create({data:{phone:'+966555190115',sortOrder:10,enabled:true,translations:{create:[{locale:'en',name:'Maan Alzalam',title:'Operation manager'},{locale:'ar',name:'معن الزلم',title:'مدير العمليات'}]}}});
 await db.contactPerson.create({data:{phone:'+966501395211',sortOrder:20,enabled:true,translations:{create:[{locale:'en',name:'Sultan Hijazi',title:'CEO'},{locale:'ar',name:'سلطان حجازي',title:'الرئيس التنفيذي'}]}}});
}

async function main(){
 await db.siteSettings.upsert({where:{id:'site'},update:{defaultLocale:'ar',websiteUrl:'https://solutiongate.sa',brandNameEnglish:'Solutions Gate',brandNameArabic:'بوابة الحلول للفعاليات',contactPhonePrimary:'+966555190115',contactPhoneSecondary:'+966501395211',contactEmail:null,addressLine1:null,addressLine2:null,city:null,region:null,country:null,mapUrl:null,contactFormEnabled:true,inquiryFormNoticeEn:'Submitted contact information is used to respond to this inquiry.',inquiryFormNoticeAr:'تُستخدم بيانات التواصل المقدمة للرد على هذا الاستفسار.'},create:{id:'site',defaultLocale:'ar',websiteUrl:'https://solutiongate.sa',brandNameEnglish:'Solutions Gate',brandNameArabic:'بوابة الحلول للفعاليات',contactPhonePrimary:'+966555190115',contactPhoneSecondary:'+966501395211',contactFormEnabled:true,inquiryFormNoticeEn:'Submitted contact information is used to respond to this inquiry.',inquiryFormNoticeAr:'تُستخدم بيانات التواصل المقدمة للرد على هذا الاستفسار.'}});
 const map=await seedPages();await seedNav(map);await seedServices();await seedProcess();await seedMetrics();await seedCapabilities();await seedPeople();
 console.log('Phase 2 source-supported seed complete.');
}
main().catch((e)=>{console.error(e);process.exit(1)}).finally(async()=>db.$disconnect());
