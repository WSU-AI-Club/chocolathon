/* ═══════════════════════════════════════════════════════════════════
   THE SUBMISSIONS, FROZEN (2026-09-20).

   The public list behind /api/gallery. It used to be read out of the
   private judging blob on every request; on 2026-09-20 that store began
   answering 403 to every read — the gallery, the judge page, and the
   ranking page all went dark with it. The competition is over and these
   17 rows will never change again, so the public half of that set lives
   here instead, in the repo, where nothing can revoke it.

   Public fields only, exactly as the API sent them: the team, the
   track, the prompt, the team's own sentence, and their links. No
   submitter name, no email, no "click first", no notes. Taken from the
   set published at 2026-09-19T19:02:36.120Z, duplicates
   already dropped and no team excluded.
   ═══════════════════════════════════════════════════════════════════ */

export type GalleryEntry = {
  team: string;
  track: "build" | "pitch";
  prompt: string;
  sentence: string;
  product?: string;
  video?: string;
  repo?: string;
};

export const GALLERY: GalleryEntry[] = [
  {
    team: "Affogato",
    track: "build",
    prompt: "B-3",
    sentence: "We built an interactive Cocoa Dolce Build Your Own Box experience that lets customers visually select their box size, choose and arrange chocolates, customize packaging, and preview their finished gift before checkout.",
    product: "https://cocoadolcebuildyourownbox-teamaffogato.lovable.app",
    video: "https://drive.google.com/file/d/1GYPhTvTOjx6sjOgtpD3YmWcpJ_NEGle9/view?usp=sharing",
  },
  {
    team: "Avalanche",
    track: "build",
    prompt: "B-2",
    sentence: "Our team built ColdChain, a thermal shipping decision engine for Cocoa Dolce’s shipping and packing team. It reads Shopify orders, estimates transit time, checks forecast conditions across the shipment route, and recommends the right packaging for each order, from no thermal protection to liners and ice packs. The system is also highly configurable, allowing the team to adjust temperature thresholds, transit rules, material quantities, product sensitivity, costs, and other decision settings to match their real-world operations.",
    product: "https://smasifhossain.github.io/coldchain-chocolate/",
    video: "https://youtu.be/qzDMUZFnSec",
    repo: "https://github.com/smAsifHossain/coldchain-chocolate",
  },
  {
    team: "Capstone",
    track: "build",
    prompt: "B-1",
    sentence: "Cocoa Vision is a camera-based capture tool for the Cocoa Dolce counter: a cashier builds a box as usual, taps one button, and every piece inside is identified against real reference photos in seconds, no extra steps or training required. It runs from a fixed camera (or straight from a phone, like in our demo), and flags anything it is not confident about instead of guessing. Each box exports into a companion dashboard showing what is selling, what is slowing down, and what to make next. Built for cashiers to run day to day and managers to read afterward.",
    product: "https://youtu.be/32krHTjpd3c?si=fMl-TNWDibBDBiYp",
    video: "https://youtu.be/32krHTjpd3c?si=fMl-TNWDibBDBiYp",
  },
  {
    team: "Cheese-Stick",
    track: "build",
    prompt: "B-3",
    sentence: "We built a custom chocolate box builder that can be easily scaled at a corporate level. You can customize every aspect of the box, from the logo on the chocolates to where each chocolate is placed. We built a mock-up of the Cocoa Dolche website to show how easily it can be integrated with the already existing site. By just moving around some of the customization options it provides a much smoother experience to the customer, and less of a headache to the employees working on the orders.",
    product: "https://cocoa-configurator.lovable.app/",
    video: "https://youtu.be/gstecmciK74",
    repo: "https://github.com/banana212421/cocoa-dolche",
  },
  {
    team: "Data-Driven Delights",
    track: "build",
    prompt: "B-1",
    sentence: "Cocoa Dolce logs every custom box sale but never what goes inside it. Chocolate Vision captures the contents at the one moment they're certain — as each piece is picked. Staff scan the tray label barcode while placing the piece, and the finished box lands in Shopify as a single line carrying every flavour. It runs inside the Shopify POS they already use, so the price, the receipt and the register are unchanged, and the data comes out through Shopify's own CSV export with nothing installed. Tested on real orders, with a browser version that runs anywhere",
    product: "Presentation link: https://docs.google.com/presentation/d/1BfTxi7Q2sGl2BEyvLhwZYvGOj0mA3jnvTnyAp8kDcnE/edit?usp=sharing |||I am unable to share the Shopify App that you will see in the video as you have to be logged into my store so here is a working app that mimics what my Shopify POS does: https://claude.ai/artifact/JYFZyN11zs3JXoHoDd5Kw3  || Some example datasets exported from Shopify: https://drive.google.com/file/d/1y4cCOVGaCLZE5HPz-TQ_FmSeeti1m0r7/view?usp=drive_link || Boxes dataset: https://drive.google.com/file/d/1xgRjeodApYUTwMLhYT5Tt92Nrw0J1qFk/view?usp=drive_link || Sold out dataset: https://drive.google.com/file/d/1GteXj1IgZfeeZ129HysqnZP6zCxWoCQV/view?usp=drive_link",
    video: "Quick Presentation Demo of the Shopify POS: https://drive.google.com/file/d/17buJvTY0DoGJ3O4oeAme0o8kdbYJeHyo/view?usp=drive_link",
  },
  {
    team: "Dulce de Leche",
    track: "build",
    prompt: "B-1",
    sentence: "AI Chocolation is a web app that opens from a link on the counter iPad, no install, no login. Whoever packs a box holds it over the open insert and it names the flavor in every cell, so a wrong piece is caught before it is bagged. It is not always right: glare and look-alike shells make it miss, so every cell is one tap to fix, and on small boxes tapping the box in by hand is still faster than the camera. Every confirmed box is saved, and Case Notes turns those records into the kitchen's make list,measured on 78 real boxes, at a median of 13.5 seconds each.",
    product: "Camera App: https://ai-chocolation.vercel.app/ Admin Dashboard: https://case-notes-delta.vercel.app/",
    video: "https://youtu.be/5hxE79yrGEc",
    repo: "https://github.com/Zookerman3/AI_Chocolation https://github.com/Zookerman3/Chocolate_Dashboard",
  },
  {
    team: "Emily Robota",
    track: "build",
    prompt: "B-4",
    sentence: "The Cocoa Dolce AI Visibility Studio is a transparent diagnostic tool that audits how visible Cocoa Dulce is to chatbots across six categories (i.e. corporate gifting, date night), then generates the content, schema, and citation plan to close each visibility gap.",
    product: "cocoa-dolce-visibility.lovable.app",
    video: "youtube.com/watch?v=heuRWnN647s&feature=youtu.be",
  },
  {
    team: "Global Scope",
    track: "build",
    prompt: "B-3",
    sentence: "Global Scope decided to pursue the Build Track, Prompt 3 Design-Your-Box. We implemented key features such as dragging-and-dropping Cocoa Dolce’s chocolates into any position of any size box Cocoa Dolce serves. We provide the opportunity to fully customize companies boxes ranging from creating multiple boxes for your order, changing the message and design of your box, as well as having a documentation of what your order was in a PDF and JSON. Different businesses and corporations can order Cocoa Dolce’s chocolate for company events.",
    product: "https://chocolate-hackathon.vercel.app/",
    video: "https://youtu.be/kBSowp5Wlh0",
    repo: "https://github.com/MadisonFranks/Chocolate-Hackathon-WSU",
  },
  {
    team: "MeltedLabs",
    track: "build",
    prompt: "B-3",
    sentence: "A visual corporate box builder that turns a logo order into a shareable proof and a factory spec.",
    product: "https://box-and-go.vercel.app",
    video: "https://youtu.be/6h9q-JJpB1Y",
    repo: "https://github.com/stiv89/box-and-go",
  },
  {
    team: "Sugar Is Sweet",
    track: "build",
    prompt: "B-1",
    sentence: "We built a software product that uses both camera and voice input to track every piece that goes into every box. The management team at Cocoa Dolce would benefit from using it because it enables better inventory management for chocolates. The software also allows Cocoa Dolce's management to view insights such as which chocolates are most popular with consumers and which combinations customers order most often.",
    product: "https://chocolathon-chocolate-vision-sugar.vercel.app/, https://youtu.be/Eg227VpUvzY, https://docs.google.com/presentation/d/12UMQtwDydHj18bgx5HecktoeF6NlLBpR/edit?usp=sharing&ouid=103576568043487689420&rtpof=true&sd=true",
    video: "https://youtu.be/3rQCNt2qjlI",
    repo: "https://github.com/khanghbduong02/Chocolathon---Chocolate-Vision---Sugar-is-Sweet",
  },
  {
    team: "SugarCult",
    track: "build",
    prompt: "B-1",
    sentence: "Choco Counter is a tap-to-add tool integrated with the checkout system that records which chocolates go into each box sold. Staff tap each piece using our UI, which keeps the process fast, then photograph the finished box with the built-in camera, so every photo is saved alongside its tap data.  That database can later be used for chocolate recognition with machine learning. We recommend pretrained open-weight image embeddings with one reference vector per chocolate type, so new varieties can be added without retraining. Ultimately, the whole process becomes a single capture at checkout.",
    product: "https://choco-counter-chi.vercel.app/",
    video: "https://www.youtube.com/watch?v=haoIhtYAtUc",
    repo: "https://github.com/Arpan1078/ChocoCounter",
  },
  {
    team: "Zenith",
    track: "build",
    prompt: "B-1",
    sentence: "CocoaLens is an offline, photo-based application that records the chocolates placed in each Cocoa Dolce box. At checkout, it'll pick the box picture, and the system detects the box layout, identifies each chocolate, and generates flavor counts and a structured box record. The cashier can review and correct individual predictions before saving, allowing Cocoa Dolce to capture customer preferences without slowing the line.",
    product: "https://docs.google.com/presentation/d/1FMIM3Gj8I1KmC8ZSOOeSaqDH7Isvvut1/edit?slide=id.p1#slide=id.p1",
    video: "https://drive.google.com/file/d/1zg1zFOe7Ae5BtwfkuQdqnRdB2bC8GQ2V/view",
    repo: "https://github.com/qasim418/Chocolathon.git",
  },
  {
    team: "A Box of Nerds",
    track: "pitch",
    prompt: "P-2",
    sentence: "New mold system for summer revenue streams",
    product: "https://drive.google.com/drive/folders/10MoC72gVvBOGQqVRUkcpWEl3FMaUUx81?usp=sharing",
    video: "https://youtu.be/sPMHZF-Agwk",
  },
  {
    team: "DECA Diamonds",
    track: "pitch",
    prompt: "P-4",
    sentence: "We're pitching Cocoa Dolce on a new customer acquisition channel: a part-time intern running TikTok and Instagram Reels to convert people who already discover Cocoa Dolce online into paying customers. Right now, visitors post about Cocoa Dolce for free with no way to capture that traffic. The intern would create chocolate making content and a 'golden ticket' factory-tour giveaway that funnels viewers straight into online orders, turning free organic attention into new customers instead of losing it.",
    product: "https://canva.link/z8a41r2rk134ffz",
    video: "https://youtube.com/shorts/ThJk_-n7xwg?feature=share",
  },
  {
    team: "One Bean Army",
    track: "pitch",
    prompt: "P-2",
    sentence: "Cocoa Dolce Sessions is a paid experience product: In-House chocolate tastings at $65 per person, hosted in the downtown lounge, and On-Site sessions at $85 per person, brought to a client's office. It's built for the downtown team to run using staff and space they already have, and for corporate HR buyers or private groups to book directly through a live site with real time pricing. It turns otherwise empty weekday afternoons into a bookable revenue stream, projected at roughly $66,300 in profit over an 18 week summer season, at zero new capital cost.",
    product: "https://cocoa-session.lovable.app/",
    video: "https://youtu.be/RUucJwLx0Ek",
  },
  {
    team: "Shocker Capital",
    track: "pitch",
    prompt: "P-2",
    sentence: "Cocoa Dolce should turn personalization into a year-round  experience. Corporate contracts fund it, a seasonal retail line  spreads it to every customer, and the business turns its quietest  months into its next peak season.​",
    product: "https://cdmk1.lovable.app/",
    video: "https://youtu.be/f0JHY1J_WXw",
    repo: "Contained in the presentation",
  },
  {
    team: "Solo PM",
    track: "pitch",
    prompt: "P-1",
    sentence: "I built the Cocoa Dolce Mold Cleaning ROI Calculator, an interactive financial modeling tool that evaluates replacing manual chocolate mold scrubbing with an industrial ultrasonic cleaning system (SharperTek XP1500-21G).  Designed for Cocoa Dolce’s operations managers, production supervisors, and finance leadership, it translates daily wash-cycle bottlenecks and labor hours into clear capital expenditure metrics. By letting decision-makers dynamically adjust labor rates, cycle frequencies, and one-time setup costs across realistic scenarios.",
    product: "https://mold-cleaning-solution-alinahianreza.lovable.app",
    video: "https://www.loom.com/share/99049a2c353948c88ad96c0a2b51d6ad",
    repo: "https://github.com/nahian-rez/mold-cleaning-solution-alinahianreza.git",
  },
];
