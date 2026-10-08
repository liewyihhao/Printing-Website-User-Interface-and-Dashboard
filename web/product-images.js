/*
 * Original printoka.com imagery, mapped onto this project (files in assets/original/).
 * Loaded before app.js (window.PK_IMAGES) and read by the server for the SSR product pages.
 *
 *  products : our product id → the original product photo (cut-out on white)
 *  option(fieldKey, value, productId) → original image for a configurator option, or null.
 *    Per-product rules are checked first, then the generic rules [fieldKeyRegex, valueRegex, file]
 *    (first match wins; field regex '' = any field).
 */
(function (root) {
  var P = {
    // Business Essentials
    1: 'Standard-Business-Card.png', 111: 'computer-form-multiply.png', 106: '4.5x9.5-White-Envelope-Window.png',
    136: 'Hardcover-Booklet.jpg', 105: 'Letterhead-Full-Color.png', 24: 'Carbonised-Form.png', 104: 'Stitched-Office-Document.jpg',
    107: 'Presentation-Folder-Cover-Image.jpg', 110: 'Book-Binded-Ticket-and-Voucher.jpg',
    // Flyers & Leaflets
    101: 'Folded-Brochure-8.png', 103: 'Non-Folded-Brochure-3.png', 50: 'Non-Folded-Brochure-1.png', 102: 'Flyers-Cropped.png', 21: 'Non-Folded-Brochure-2.png',
    // Labels & Stickers
    117: 'Car-Window-Sticker.png', 60: 'Round-Sticker-Cover.png', 61: 'Round-Corner-Sticker.png', 184: 'Round-Sticker.png',
    116: 'Car-Window-Sticker.png', 176: 'custom-die-cut-sticker.png',
    // Books & Stationery
    37: 'Booklet-Staple-Content.png', 164: 'Hardcover-Booklet.jpg', 163: 'leather-portrait.jpg', 19: 'Booklet-Perfect-Cover.png',
    121: 'soft-stand-table-calendar.png',
    // Cards & Invitations
    169: 'Money-Packet-Horizontal.png', 166: '6x8-Folded-Cards-1.png', 168: 'Money-Pack-Vertical-2.png', 138: 'Money-Pack-Vertical-3.png',
    167: 'Money-Pack-Vertical.png', 113: 'frosted-plastic-card.jpg', 115: 'A5-Size-Folded-Cards.png', 114: 'Non-folded-Invitation-Cards.png',
    165: 'Custom-Die-Cut-Business-Card.png',
    // Large Format
    160: 'Stand-Banner.png', 161: 'Stand-Banner.png', 162: 'Stand-Banner.png', 124: 'Stand-Banner.png', 159: 'Roll-Up-Banner.png',
    125: 'Roll-Up-Banner.png', 123: 'Hanging-Banner.png',
    // Packaging & Boxes
    179: 'diecut-box.jpg', 127: 'Paperbag-290x200x95-1.png', 178: 'Paperbag-cover.jpg',
    // Apparel & Gifts
    132: 'Button-Badge.png', 128: 'C20.png', 133: 'HFS001.png', 174: 'lanyard.png', 139: 'N31A.png', 147: 'NH03A.png', 148: 'N01A.png',
    146: 'C10.png',
  };

  // per-product rules: Business Card types use the original card photos; sticker products map cut shapes
  var STICKERS = { 60: 1, 61: 1, 184: 1, 176: 1 };
  var PR = {
    1: [['category', /^standard$/i, 'Standard-Business-Card.png'], ['category', /fold/i, 'Folded-Business-Card.png'],
        ['category', /die.?cut/i, 'Custom-Die-Cut-Business-Card.png'], ['category', /plastic/i, 'frosted-plastic-card.jpg']],
  };
  var STICKER_RULES = [['category', /^round$/i, 'Round-Sticker.png'], ['category', /oval/i, 'Oval-Sticker.png'],
    ['category', /rectangle|square|standard shape/i, 'Square-Sticker.png'], ['category', /custom|kiss cut|multiple dieline/i, 'custom-die-cut-sticker.png']];

  var R = [
    // ---- paper / board / sticker materials ----
    ['paper|material|cover|content|inc_paper|stock', /frosted plastic/i, 'frosted-plastic-card.jpg'],
    ['', /black plastic/i, 'black-plastic.jpg'],
    ['', /matte art card|matte art paper|matt art/i, 'matte-art-paper.jpg'],
    ['', /gloss art card|^art card|\bart card\b/i, 'gloss-art-card.jpg'],
    ['', /gloss art paper|^art paper|\bart paper\b/i, 'gloss-art-paper.jpg'],
    ['', /linen/i, 'linen.jpg'],
    ['', /metal ice/i, 'metal-ice.jpg'],
    ['', /synthetic/i, 'synthetic-paper.jpg'],
    ['', /super white/i, 'super-white.jpg'],
    ['', /suwen/i, 'suwen.jpg'],
    ['', /conqueror.*vellum|\bvellum\b/i, 'conqueror-vellum.jpg'],
    ['', /conqueror|brilliant white/i, 'brilliant-white.jpg'],
    ['', /mirror ?kote|mirrorkorte|mirrorkote/i, 'mirror-kote.jpg'],
    ['', /removable/i, 'removable-white-pp.jpg'],
    ['', /opp|transparent (pet|film)|^transparent$/i, 'opp-transparent.jpg'],
    ['', /white pp/i, 'white-pp.jpg'],
    ['', /matte silver/i, 'matte-silver.jpg'],
    ['', /bright silver|silver polyester|metalised|metallised/i, 'bright-silver.jpg'],
    ['', /silver foil board/i, 'silver-foil-board.jpg'],
    ['', /warranty/i, 'warranty.jpg'],
    ['', /grey back|box ?board/i, 'box-board-grey-back.jpg'],
    ['', /b-?flute.*(brown|kraft)/i, 'b-flute-brown.jpg'], ['', /b-?flute.*white/i, 'b-flute-white.jpg'], ['', /b-?flute/i, 'b-flute-corrugated.jpg'],
    ['', /e-?flute.*(brown|kraft)/i, 'e-flute-brown.jpg'], ['', /e-?flute.*white/i, 'e-flute-white.jpg'], ['', /e-?flute/i, 'e-flute-corrugated.jpg'],
    ['', /brown kraft|kraft|craft/i, 'brown-craft.jpg'],
    ['', /simili/i, 'simili-paper.jpg'],
    ['', /woodfree|printing paper|uncoated/i, 'printing-paper.jpg'],
    ['', /black canvas/i, 'black-canvas.jpg'],
    // ---- lamination / coating / finishing ----
    ['lamination|finishing|coating|cover_lamination|spot', /spot ?uv/i, 'matte-laminationspot-uv.jpg'],
    ['lamination|finishing|coating|cover_lamination', /gloss (lamination|laminate|laminating)|^gloss$/i, 'gloss-lamination.jpg'],
    ['lamination|finishing|coating|cover_lamination', /matte? (lamination|laminate|laminating)/i, 'matte-lamination.jpg'],
    ['lamination|finishing|coating|cover_lamination', /water ?based|waterbase/i, 'gloss-waterbased.jpg'],
    ['emboss', /front|back|required|both/i, 'emboss-finishing.jpg'],
    ['round_corner$', /^required$/i, 'round-corner.jpg'],
    ['glu', /required|glued/i, 'glued.jpg'],
    // ---- hot stamping foil colours ----
    ['hot_stamping_colour|hs_colour|foil|stamping_colour', /gold/i, 'hot-stamping-gold.jpg'],
    ['hot_stamping_colour|hs_colour|foil|stamping_colour', /silver/i, 'hot-stamping-silver.jpg'],
    ['hot_stamping_colour|hs_colour|foil|stamping_colour', /black/i, 'hot-stamping-black.jpg'],
    ['hot_stamping_colour|hs_colour|foil|stamping_colour', /blue/i, 'hot-stamping-blue.jpg'],
    ['hot_stamping_colour|hs_colour|foil|stamping_colour', /green/i, 'hot-stamping-green.jpg'],
    ['hot_stamping_colour|hs_colour|foil|stamping_colour', /red/i, 'hot-stamping-red.jpg'],
    // ---- folding (fold codes) ----
    ['fold', /^1fa$/i, 'F1-1Fa.jpg'], ['fold', /^2fa$/i, 'F7-2Fa.png'], ['fold', /^2fb$/i, 'F8-2Fb.png'], ['fold', /^2fc$/i, 'F2-2Fc.png'],
    ['fold', /^3fa$/i, 'F10-3Fa.png'], ['fold', /^3fb$/i, 'F13-3Fb.png'], ['fold', /^4fa$/i, 'F11-4Fa.png'],
    // ---- sticker shapes (the "shape" field only) ----
    ['^shape$', /^round$/i, 'Round-Sticker.png'],
    ['^shape$', /oval/i, 'Oval-Sticker.png'],
    ['^shape$', /rectangle|square/i, 'Square-Sticker.png'],
    ['^shape$', /custom.*(die.?cut|shape)|kiss cut/i, 'custom-die-cut-sticker.png'],
    // ---- bag / handle / rope colours (swatches) ----
    ['colour|color', /^black$/i, 'black.jpg'], ['colour|color', /^white$/i, 'white.jpg'], ['colour|color', /^beige$/i, 'beige.jpg'],
    ['colour|color', /^yellow$/i, 'yellow.jpg'], ['colour|color', /^dark orange$/i, 'dark-orange.jpg'], ['colour|color', /^orange$/i, 'orange.jpg'],
    ['colour|color', /^magenta$/i, 'magenta.jpg'], ['colour|color', /^maroon$/i, 'maroon.jpg'], ['colour|color', /^milo green$/i, 'milo-green.jpg'],
    ['colour|color', /^dark green$/i, 'dark-green.jpg'], ['colour|color', /^turquoise$/i, 'turquoise.jpg'], ['colour|color', /^cyan$/i, 'cyan.jpg'],
    ['colour|color', /^royal blue$/i, 'royal-blue.jpg'], ['colour|color', /^navy blue$/i, 'navy-blue.jpg'], ['colour|color', /^dark purple$/i, 'dark-purple.jpg'],
    ['colour|color', /^light brown$/i, 'light-brown.jpg'], ['colour|color', /^dark brown$/i, 'dark-brown.jpg'], ['colour|color', /^(grey|dark grey)$/i, 'dark-grey.jpg'],
    ['colour|color', /^light grey$/i, 'light-grey.jpg'],
    // ---- print colour ----
    ['printcolour|print_colour|colour', /^1c\b|black ?(and|&) ?white/i, 'black-white-printing.jpg'],
    ['printcolour|print_colour|colour', /^4c\b|full colou?r/i, 'colorful-printing.jpg'],
    ['side', /single|one side|1 side|front only/i, 'single-sided.jpg'], ['side', /double|two side|2 side|both/i, 'two-sided.jpg'],
    // ---- orientation, hole punching, numbering, perforation, copy change ----
    ['orientation', /portrait/i, 'portrait.jpg'], ['orientation', /landscape/i, 'landscape.jpg'],
    ['hole', /^no|not required/i, 'no-hole-punch.png'], ['hole', /mm|required|yes/i, 'with-hole-punch.png'],
    ['numbering', /required|yes|[1-9]/i, 'Numbering.jpg'],
    ['perforat', /[1-9]|line|required|yes/i, 'Perforating.jpg'],
    ['copy', /^no|not required/i, 'no-copy-change.png'], ['copy', /required|yes|change/i, 'copy-change.png'],
    // ---- lanyard parts ----
    ['', /lobster hook.*semi|semi.?d/i, 'lobster-hooksemi-D.jpg'], ['', /lobster/i, 'lobster-hook.jpg'],
    ['', /oval hook/i, 'oval-hook.jpg'], ['', /crocodile/i, 'crocodile-clip.jpg'], ['', /safety clip/i, 'safety-clip-small.jpg'],
    ['', /friction lock/i, 'friction-lock.jpg'], ['', /slit lock/i, 'slit-lock.jpg'], ['', /buckle/i, 'buckle.jpg'],
    // ---- paper sizes (named); finishing-area sizes (hot stamp, emboss, window) get no picture ----
    ['stamp|hs_|emboss|deboss|window', /./, null],
    ['size', /^a1\b/i, 'A1.jpg'], ['size', /^a2\b/i, 'A2.jpg'], ['size', /^a3\b/i, 'A3.jpg'], ['size', /^a4\b/i, 'A4.jpg'], ['size', /^a5\b/i, 'A5.jpg'],
    ['size', /^a6\b/i, 'A6.jpg'], ['size', /^a7\b/i, 'A7.jpg'], ['size', /^b5\b/i, 'B5.jpg'], ['size', /^dl\b/i, 'DL.jpg'],
    ['size', /^3\s*x\s*a4/i, '3xA4.jpg'], ['size', /^4\s*x\s*a4/i, '4xA4.jpg'], ['size', /^4\s*x\s*a5/i, '4xA5.jpg'], ['size', /^3\s*x\s*a5/i, '3xA5.jpg'],
    ['size', /^2\s*x\s*dl/i, '2xDL.jpg'],
  ];

  // dimension images named "<a>x<b>mm.jpg" (key = long side x short side)
  var DIMS = { '89x54': '89x54mm.jpg', '86x54': '86x54mm.jpg', '86x52': '86x52mm.jpg', '89x50': '89x50mm.jpg',
    '178x54': '54x178mm.jpg', '172x52': '52x172mm.jpg', '172x50': '50x172mm.jpg', '156x52': '52x156mm.jpg',
    '108x89': '89x108mm.jpg', '104x86': '86x104mm.jpg', '100x86': '86x100mm.jpg', '88x86': '86x88mm.jpg',
    '145x105': '105x145mm.jpg', '300x105': '105x300mm.jpg', '190x107': '107x190mm.jpg', '230x120': '120x230mm.jpg',
    '175x125': '125x175mm.jpg', '145x145': '145x145mm.jpg', '210x145': '145x210mm.jpg', '152x152': '152x152.jpg', '280x140': '280x140.jpg',
    '213x55': '55x213mm.jpg', '210x60': '60x210mm.jpg', '140x90': '90x140mm.jpg', '190x90': '90x190mm.jpg', '225x95': '95x225mm.jpg',
    // ISO paper sizes given in mm
    '841x594': 'A1.jpg', '840x594': 'A1.jpg', '594x420': 'A2.jpg', '420x297': 'A3.jpg', '297x210': 'A4.jpg', '210x148': 'A5.jpg',
    '148x105': 'A6.jpg', '105x74': 'A7.jpg', '250x176': 'B5.jpg', '210x99': 'DL.jpg', '220x110': 'DL.jpg',
    '630x297': '3xA4.jpg', '840x297': '4xA4.jpg', '594x210': '4xA5.jpg', '444x210': '3xA5.jpg', '420x210': '2xDL.jpg' };

  function norm(s) { return String(s == null ? '' : s).trim(); }
  function option(fieldKey, value, productId) {
    var k = norm(fieldKey).toLowerCase(), v = norm(value);
    if (!v) return null;
    var pr = (PR[productId] || []).concat(STICKERS[productId] ? STICKER_RULES : []);
    for (var j = 0; j < pr.length; j++) if (new RegExp(pr[j][0], 'i').test(k) && pr[j][1].test(v)) return pr[j][2];
    if (/^(-\s*)?(not required|no required|none|n\/a|no)(\s*-)?$/i.test(v) && !/hole|copy/.test(k)) return null;
    if (/size/.test(k) && !/stamp|hs_|emboss|deboss|window|header|content/.test(k)) {
      var nums = (v.match(/(\d+(?:\.\d+)?)\s*mm/g) || []).map(function (x) { return parseFloat(x); });
      if (nums.length >= 2) { var a = Math.max(nums[0], nums[1]), b = Math.min(nums[0], nums[1]); var d = DIMS[a + 'x' + b]; if (d) return d; }
    }
    for (var i = 0; i < R.length; i++) {
      var r = R[i];
      if (r[0] && !new RegExp(r[0], 'i').test(k)) continue;
      if (r[1].test(v)) return r[2] || null;
    }
    return null;
  }
  // Printoka product hero images (assets/products/, see integration-manifest.json): one per product id.
  // Used for product cards, the configurator hero and SEO pages. Option images above stay on assets/original/.
  var HERO = {
    1: "Business Cards.png",
    19: "Offset Printing Booklets.png",
    21: "Offset Loose Sheets.png",
    24: "NCR Bill Books.png",
    37: "Digital Printing Booklets.png",
    50: "Digital Loose Sheets.png",
    60: "Digital Stickers & Labels.png",
    61: "Hot Stamping Labels.png",
    101: "Brochures.png",
    102: "Flyers & Leaflets.png",
    103: "Custom Printing.png",
    104: "Notepads.png",
    105: "Letterheads.png",
    106: "Envelopes.png",
    107: "Presentation Folders.png",
    108: "L-Shape Folders.png",
    109: "Bookmarks.png",
    110: "Vouchers & Tickets.png",
    111: "Computer Forms (NCR).png",
    112: "Wire-O Notebooks.png",
    113: "PVC Cards.png",
    114: "Wedding Invitation Cards.png",
    115: "Thank You Cards.png",
    116: "Static Cling Window Stickers.png",
    117: "Car Window Stickers.png",
    118: "Wall Calendars.png",
    119: "Arch Files.png",
    120: "Hard-Stand Desk Calendars.png",
    121: "Soft-Stand Desk Calendars.png",
    122: "Wire-O Wall Calendars.png",
    123: "PVC Banners.png",
    124: "Buntings.png",
    125: "Roll-Up Stands.png",
    126: "Wobblers.png",
    127: "Paper Bags.png",
    128: "Canvas Tote Bags.png",
    129: "Custom Mugs.png",
    130: "Papan Kopi - Sachet Board.png",
    131: "Pillow.png",
    132: "Button Badges.png",
    133: "Hand Fans.png",
    134: "Hanger.png",
    135: "Magnet.png",
    136: "Hard Cover Menus.png",
    137: "Standing Pouches.png",
    138: "Money Packets.png",
    139: "Non-Woven Bags.png",
    140: "Tent Cards.png",
    141: "Stamp Chops.png",
    143: "Sublimation T-Shirts.png",
    144: "Cooler Bag.png",
    145: "DTF Tote Bag With Zip.png",
    146: "Heat Transfer Tote Bag.png",
    147: "Laminated Non-Woven Bags.png",
    148: "RPET Non-Woven Bags.png",
    149: "Toast Bags.png",
    150: "3-Side Seal Packaging.png",
    151: "Kraft Standing Pouches.png",
    152: "Spouted Standing Pouches.png",
    153: "Vacuum Bags.png",
    154: "Foamboards.png",
    155: "Magnetic Foamboards.png",
    156: "Foldable POP Displays.png",
    157: "POP Displays.png",
    158: "Wind Flags.png",
    159: "Economy Roll-Up Stands.png",
    160: "Bunting — Gear X Stand.png",
    161: "Bunting — Round Base Stand.png",
    162: "Bunting — Tripod Stand.png",
    164: "Hardcover Notebooks.png",
    165: "Die-Cut Creative Cards.png",
    166: "Greeting Cards.png",
    167: "Premium Money Packet.png",
    168: "Hot Stamping Money Packet.png",
    169: "Envelope Money Packet.png",
    170: "ID Cards.png",
    172: "DTF T-Shirts.png",
    173: "Silkscreen T-Shirts.png",
    174: "Lanyards.png",
    175: "Premium Desk Calendars.png",
    176: "UV DTF Stickers.png",
    177: "Food Trays.png",
    178: "Kraft Paper Bags.png",
    179: "Gift Boxes.png",
    180: "Corporate Shirts.png",
    181: "Custom Jackets.png",
    182: "Muslimah Sublimation Wear.png",
    183: "Sweatshirts & Hoodies.png",
    184: "Roll Form Stickers.png",
    185: "Custom Caps.png",
  };
  var HERO_V = { 1: "bb16c1c59c", 19: "8f6fa82dca", 21: "be9a9b7845", 24: "1f54ab6121", 37: "4b3802956d", 50: "1788fe60c0", 60: "daa8a42d56", 61: "88c10ff15b", 101: "f0f4577a05", 102: "034d99a67e", 103: "b0443d538e", 104: "0b15302326", 105: "21ac86536a", 106: "2b80255599", 107: "3b6e4f0010", 108: "47c6020ab1", 109: "c238eee7b1", 110: "fcc0ebff19", 111: "c8215a54d8", 112: "99265dff21", 113: "83fc144c6f", 114: "e0ee7d129e", 115: "4caebd0291", 116: "65f9bcee14", 117: "f1c2b9b6ed", 118: "7df4d57207", 119: "6a4c080345", 120: "c52dfe164a", 121: "f7e451572c", 122: "d53d802723", 123: "383606a802", 124: "1f4f0b4664", 125: "ae9b9f1913", 126: "a657d3b144", 127: "7ca9976b36", 128: "c882d66f0c", 129: "7936d90876", 130: "b67885e93c", 131: "21aaf19e59", 132: "eb3de6b9ae", 133: "45ccd9003b", 134: "eead1c0723", 135: "ceb5b48a4a", 136: "d41fccb9e2", 137: "1399bda020", 138: "a94657fcd8", 139: "fc2f3ed619", 140: "20fa980694", 141: "fbffdfb161", 143: "a661a20601", 144: "3c3970bab9", 145: "95a569a164", 146: "847f7819a2", 147: "b6d044e389", 148: "d3d8641748", 149: "f860c21db5", 150: "6d7c923a05", 151: "a69bf2c246", 152: "d9a20d7038", 153: "772035a07f", 154: "678baacbba", 155: "1c76a39b87", 156: "d40a59900f", 157: "3db56673db", 158: "2c5df1863e", 159: "f39f4b7af1", 160: "14758eec91", 161: "b2adb1c6fc", 162: "352eb7385b", 164: "47a33012ef", 165: "ce5945be4b", 166: "3bcd30fbb9", 167: "11cc7929a9", 168: "88ad29059b", 169: "0bff317b34", 170: "4e9887c2bd", 172: "1a56a99092", 173: "09e1071368", 174: "375c64aed0", 175: "962044f86e", 176: "c5afe1ac65", 177: "99bebbcc07", 178: "08e91fb60e", 179: "019b1898bf", 180: "982439a37a", 181: "95a139cc9d", 182: "1f020e0c70", 183: "18712bef43", 184: "5817d74934", 185: "ae84abcfe4" };
  // hero(id) -> site-relative URL (spaces and symbols encoded, content hash for cache busting), or null
  function hero(id) { var f = HERO[id]; return f ? 'assets/products/' + encodeURIComponent(f) + '?v=' + HERO_V[id] : null; }
  var api = { products: P, option: option, base: 'assets/original/', heroes: HERO, hero: hero };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.PK_IMAGES = api;
})(typeof window !== 'undefined' ? window : null);
