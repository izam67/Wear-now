/**
 * Every image on the site is referenced by its Unsplash photo id.
 *
 * Ids in `POOL` were verified to return HTTP 200. Keeping them in one place
 * means swapping in real product photography later is a single-file change —
 * replace the ids and the derived URLs update everywhere.
 */

const UNSPLASH = "https://images.unsplash.com/";

export type ImageFit = "crop" | "clip";

/** Builds an optimised Unsplash URL. `q` is tuned per surface. */
export function unsplash(
  id: string,
  opts: { w?: number; h?: number; q?: number; fit?: ImageFit; dpr?: number } = {},
) {
  const { w = 1200, h, q = 78, fit = "crop", dpr } = opts;
  const params = new URLSearchParams({
    auto: "format",
    fit,
    q: String(q),
  });
  if (w) params.set("w", String(Math.round(w * (dpr ?? 1))));
  if (h) params.set("h", String(Math.round(h * (dpr ?? 1))));
  return `${UNSPLASH}${id}?${params.toString()}`;
}

export const IMG = {
  /** Product card / grid image. */
  card: (id: string) => unsplash(id, { w: 900, h: 1200, q: 76 }),
  /** Product detail main image. */
  zoom: (id: string) => unsplash(id, { w: 1400, h: 1750, q: 82 }),
  /** Thumbnail in the gallery. */
  thumb: (id: string) => unsplash(id, { w: 160, h: 200, q: 55 }),
  /**
   * Cart / checkout / order-line product thumbnail.
   *
   * These lines come from the `cart_items` and `order_items` joins, which carry
   * the raw Unsplash photo id rather than a URL — always run them through this
   * helper, or `next/image` throws on a relative-looking `src`.
   */
  lineItem: (id: string) => unsplash(id, { w: 240, h: 300, q: 68 }),
  /** Masonry / editorial tile — height chosen per row to create rhythm. */
  tile: (id: string, h: number) => unsplash(id, { w: 800, h, q: 74 }),
  /** Category card, 4:5. */
  category: (id: string) => unsplash(id, { w: 900, h: 1125, q: 76 }),
  /** Hero / banner, wide. */
  hero: (id: string) => unsplash(id, { w: 2000, h: 1250, q: 80 }),
  /** Review avatar. */
  avatar: (id: string) => unsplash(id, { w: 120, h: 120, q: 60 }),
  /** Customer review photo. */
  review: (id: string) => unsplash(id, { w: 600, h: 600, q: 70 }),
  /** Social / og image. */
  social: (id: string) => unsplash(id, { w: 1200, h: 630, q: 82 }),
} as const;

/* ------------------------------------------------------------------ *
 * Verified pools, grouped by the kind of shot they contain.
 * ------------------------------------------------------------------ */

export const POOL = {
  editorial: [
    "photo-1490481651871-ab68de25d43d",
    "photo-1515886657613-9f3515b0c78f",
    "photo-1469334031218-e382a71b716b",
    "photo-1483985988355-763728e1935b",
    "photo-1525507119028-ed4c629a60a3",
    "photo-1496747611176-843222e1e57c",
    "photo-1485230895905-ec40ba36b9bc",
    "photo-1503342217505-b0a15ec3261c",
    "photo-1509319117193-57bab727e09d",
    "photo-1521223890158-f9f7c3d5d504",
    "photo-1529903384028-929ae5dccdf1",
    "photo-1479064555552-3ef4979f8908",
    "photo-1554568218-0f1715e72254",
    "photo-1558769132-cb1aea458c5e",
    "photo-1533659124865-d6072dc035e1",
    "photo-1573496359142-b8d87734a5a2",
    "photo-1594633312681-425c7b97ccd1",
    "photo-1487222477894-8943e31ef7b2",
    "photo-1566174053879-31528523f8ae",
    "photo-1487412720507-e7ab37603c6f",
    "photo-1524504388940-b1c1722653e1",
    "photo-1509631179647-0177331693ae",
    "photo-1512316609839-ce289d3eba0a",
    "photo-1554151228-14d9def656e4",
    "photo-1515372039744-b8f02a3ae446",
    "photo-1503342394128-c104d54dba01",
    "photo-1583744946564-b52ac1c389c8",
    "photo-1567401893414-76b7b1e5a7a5",
    "photo-1593032465175-481ac7f401a0",
    "photo-1595777457583-95e059d581b8",
    "photo-1495385794356-15371f348c31",
    "photo-1462927114214-6956d2fddd4e",
    "photo-1618886614638-80e3c103d31a",
    "photo-1524678606370-a47ad25cb82a",
    "photo-1552374196-c4e7ffc6e126",
    "photo-1556306535-0f09a537f0a3",
    "photo-1547949003-9792a18a2601",
    "photo-1610375461246-83df859d849d",
    "photo-1594035910387-fea47794261f",
    "photo-1519741497674-611481863552",
    "photo-1517048676732-d65bc937f952",
    "photo-1531988042231-d39a9cc12a9a",
    "photo-1553545204-4f7d339aa06a",
    "photo-1551107696-a4b0c5a0d9a2",
    "photo-1562788869-4ed32648eb72",
    "photo-1607083206968-13611e3d76db",
    "photo-1543163521-1bf539c55dd2",
    "photo-1506152983158-b4a74a01c721",
    "photo-1523381210434-271e8be1f52b",
    "photo-1591195853828-11db59a44f6b",
    "photo-1515372039744-b8f02a3ae446",
    "photo-1552374196-c4e7ffc6e126",
    "photo-1560243563-062bfc001d68",
    "photo-1549298916-b41d501d3772",
    "photo-1556905055-8f358a7a47b2",
    "photo-1526470608268-f674ce90ebd4",
    "photo-1556306535-38febf6782e7",
    "photo-1596704017254-9b121068fb31",
  ],
  menswear: [
    "photo-1507003211169-0a1dd7228f2d",
    "photo-1500648767791-00dcc994a43e",
    "photo-1506794778202-cad84cf45f1d",
    "photo-1502823403499-6ccfcf4fb453",
    "photo-1618354691373-d851c5c3a990",
    "photo-1521572163474-6864f9cf17ab",
    "photo-1571945153237-4929e783af4a",
    "photo-1564584217132-2271feaeb3c5",
    "photo-1620799140408-edc6dcb6d633",
    "photo-1596755094514-f87e34085b2c",
    "photo-1581044777550-4cfa60707c03",
    "photo-1541101767792-f9b2b1c4f127",
    "photo-1535043934128-cf0b28d52f95",
    "photo-1608234807905-4466023792f5",
    "photo-1620138546344-7b2c38516edf",
    "photo-1518621736915-f3b1c41bfd00",
    "photo-1590548784585-643d2b9f2925",
    "photo-1602751584552-8ba73aad10e1",
    "photo-1519415943484-9fa1873496d4",
    "photo-1571781926291-c477ebfd024b",
    "photo-1524250502761-1ac6f2e30d43",
    "photo-1502163140606-888448ae8cfe",
    "photo-1611930022073-b7a4ba5fcccd",
    "photo-1533669955142-6a73332af4db",
    "photo-1512310604669-443f26c35f52",
    "photo-1607082349566-187342175e2f",
    "photo-1520639888713-7851133b1ed0",
    "photo-1517254797898-04edd251bfb3",
    "photo-1606760227091-3dd870d97f1d",
    "photo-1603808033192-082d6919d3e1",
    "photo-1607522370275-f14206abe5d3",
    "photo-1524805444758-089113d48a6d",
    "photo-1489987707025-afc232f7ea0f",
    "photo-1441984904996-e0b6ba687e04",
    "photo-1441986300917-64674bd600d8",
  ],
  shoes: [
    "photo-1549298916-b41d501d3772",
    "photo-1600185365483-26d7a4cc7519",
    "photo-1595950653106-6c9ebd614d3a",
    "photo-1552346154-21d32810aba3",
    "photo-1608231387042-66d1773070a5",
    "photo-1512374382149-233c42b6a83b",
    "photo-1542291026-7eec264c27ff",
    "photo-1560769629-975ec94e6a86",
    "photo-1600269452121-4f2416e55c28",
    "photo-1491553895911-0055eca6402d",
    "photo-1556906781-9a412961c28c",
    "photo-1543163521-1bf539c55dd2",
    "photo-1519415387722-a1c3bbef716c",
    "photo-1560343090-f0409e92791a",
    "photo-1589128777073-263566ae5e4d",
    "photo-1620625515032-6ed0c1790c75",
    "photo-1610030469983-98e550d6193c",
    "photo-1556306535-38febf6782e7",
    "photo-1524678606370-a47ad25cb82a",
    "photo-1556905055-8f358a7a47b2",
  ],
  bags: [
    "photo-1584917865442-de89df76afd3",
    "photo-1566150905458-1bf1fc113f0d",
    "photo-1548036328-c9fa89d128fa",
    "photo-1590874103328-eac38a683ce7",
    "photo-1594223274512-ad4803739b7c",
    "photo-1603808033192-082d6919d3e1",
    "photo-1606760227091-3dd870d97f1d",
    "photo-1559563458-527698bf5295",
    "photo-1535632066927-ab7c9ab60908",
    "photo-1611085583191-a3b181a88401",
    "photo-1584302179602-e4c3d3fd629d",
    "photo-1573408301185-9146fe634ad0",
    "photo-1633934542430-0905ccb5f050",
    "photo-1610375461246-83df859d849d",
    "photo-1583744946564-b52ac1c389c8",
    "photo-1503342394128-c104d54dba01",
    "photo-1602751584552-8ba73aad10e1",
  ],
  jewelry: [
    "photo-1611591437281-460bfbe1220a",
    "photo-1599643478518-a784e5dc4c8f",
    "photo-1515562141207-7a88fb7ce338",
    "photo-1611652022419-a9419f74343d",
    "photo-1605100804763-247f67b3557e",
    "photo-1602173574767-37ac01994b2a",
    "photo-1617038220319-276d3cfab638",
    "photo-1599643477877-530eb83abc8e",
    "photo-1617038260897-41a1f14a8ca0",
    "photo-1535632066927-ab7c9ab60908",
    "photo-1584302179602-e4c3d3fd629d",
  ],
  accessories: [
    "photo-1572635196237-14b3f281503f",
    "photo-1511499767150-a48a237f0083",
    "photo-1473496169904-658ba7c44d8a",
    "photo-1506806732259-39c2d0268443",
    "photo-1610375461246-83df859d849d",
    "photo-1519741497674-611481863552",
    "photo-1556906781-9a412961c28c",
    "photo-1524678606370-a47ad25cb82a",
    "photo-1589128777073-263566ae5e4d",
    "photo-1606760227091-3dd870d97f1d",
  ],
  lifestyle: [
    "photo-1441984904996-e0b6ba687e04",
    "photo-1441986300917-64674bd600d8",
    "photo-1445205170230-053b83016050",
    "photo-1550246140-29f40b909e5a",
    "photo-1519681393784-d120267933ba",
    "photo-1485462537746-965f33f7f6a7",
    "photo-1467043237213-65f2da53396f",
    "photo-1520975954732-35dd22299614",
    "photo-1547949003-9792a18a2601",
    "photo-1494790108377-be9c29b29330",
    "photo-1517841905240-472988babdf9",
    "photo-1534528741775-53994a69daeb",
    "photo-1487412720507-e7ab37603c6f",
  ],
  portraits: [
    "photo-1494790108377-be9c29b29330",
    "photo-1517841905240-472988babdf9",
    "photo-1534528741775-53994a69daeb",
    "photo-1487412720507-e7ab37603c6f",
    "photo-1500648767791-00dcc994a43e",
    "photo-1507003211169-0a1dd7228f2d",
    "photo-1524504388940-b1c1722653e1",
    "photo-1506794778202-cad84cf45f1d",
    "photo-1573496359142-b8d87734a5a2",
    "photo-1552374196-c4e7ffc6e126",
  ],
} as const;

export type PoolName = keyof typeof POOL;
