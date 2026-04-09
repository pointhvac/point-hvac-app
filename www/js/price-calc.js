/**
 * Point HVAC - Fiyat Hesaplama
 */

const PriceCalc = (() => {

  /** Liste fiyatina iskonto uygula. */
  function applyDiscount(listPrice, discountPercent) {
    if (listPrice == null || discountPercent == null) return null;
    return listPrice * (1 - discountPercent / 100);
  }

  /** KDV ekle. */
  function addVAT(price, vatPercent = 20) {
    if (price == null) return null;
    return price * (1 + vatPercent / 100);
  }

  /** Tam fiyat hesapla: liste -> iskonto -> net. */
  function calculate(listPrice, discountPercent = 0) {
    const net = applyDiscount(listPrice, discountPercent);
    return {
      list: listPrice,
      discount: discountPercent,
      net: net,
      netFormatted: formatCurrency(net),
      listFormatted: formatCurrency(listPrice)
    };
  }

  /** Inverter fiyat hesapla (motor gucune gore sabit oranlar). */
  function inverterPrice(motorKW) {
    if (motorKW == null) return null;
    // Sabit inverter fiyat tablosu (kW -> EUR)
    const table = [
      [0.75, 180], [1.1, 200], [1.5, 220], [2.2, 260],
      [3, 300], [4, 360], [5.5, 450], [7.5, 550],
      [11, 750], [15, 950], [18.5, 1150], [22, 1350],
      [30, 1750], [37, 2100], [45, 2500], [55, 3000],
      [75, 4000], [90, 5000], [110, 6000]
    ];
    // En yakin motor gucunu bul
    let closest = table[table.length - 1];
    for (const [kw, price] of table) {
      if (kw >= motorKW) { closest = [kw, price]; break; }
    }
    return closest[1];
  }

  return { applyDiscount, addVAT, calculate, inverterPrice };
})();
