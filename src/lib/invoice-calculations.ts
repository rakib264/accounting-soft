type InvoiceAmountFields = {
  subtotal: number;
  vatAmount: number;
  total?: number;
};

export function getInvoiceGrossTotal(invoice: InvoiceAmountFields) {
  return Number((invoice.subtotal + invoice.vatAmount).toFixed(2));
}

export function getInvoiceAmountDue(invoice: InvoiceAmountFields, amountReceived = 0) {
  return Number((getInvoiceGrossTotal(invoice) - amountReceived).toFixed(2));
}
