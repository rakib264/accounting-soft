type InvoiceAmountFields = {
  subtotal: number;
  vatAmount: number;
  vatPercent?: number;
  total?: number;
};

/** Invoice gross total always includes VAT: subtotal + VAT amount. */
export function getInvoiceGrossTotal(invoice: InvoiceAmountFields) {
  return Number((invoice.subtotal + invoice.vatAmount).toFixed(2));
}

export function getInvoiceAmountDue(invoice: InvoiceAmountFields, amountReceived = 0) {
  return Number((getInvoiceGrossTotal(invoice) - amountReceived).toFixed(2));
}

export const invoiceGrossTotalExpression = { $add: ["$subtotal", "$vatAmount"] };

export function normalizeInvoiceAmounts<T extends InvoiceAmountFields>(invoice: T) {
  const grossTotal = getInvoiceGrossTotal(invoice);
  return {
    ...invoice,
    total: grossTotal,
  };
}
