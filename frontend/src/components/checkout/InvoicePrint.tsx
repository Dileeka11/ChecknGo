interface InvoicePrintProps {
  invoice: {
    invoiceNumber: string;
    customerName: string;
    items: Array<{
      itemName: string;
      quantity: number;
      weight: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    subtotal: number;
    discount: number;
    totalAmount: number;
    paymentMethod: string;
    createdBy: string;
    createdAt: string;
  };
}

const InvoicePrint = ({ invoice }: InvoicePrintProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ fontFamily: "'Courier New', monospace", fontSize: '14px', color: '#000', backgroundColor: '#fff', padding: '10px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>ChecknGo</h1>
        <p style={{ fontSize: '12px', color: '#666', margin: '2px 0' }}>AI-Powered Smart Checkout</p>
        <p style={{ fontSize: '12px', color: '#666', margin: '2px 0' }}>Fresh Produce Store</p>
        <p style={{ fontSize: '12px', color: '#666', margin: '2px 0' }}>Tel: +94 11 234 5678</p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '12px 0' }} />

      {/* Invoice Info */}
      <div style={{ marginBottom: '12px', fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Invoice No:</span>
          <span style={{ fontWeight: 'bold' }}>{invoice.invoiceNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Date:</span>
          <span>{formatDate(invoice.createdAt)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Customer:</span>
          <span>{invoice.customerName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Cashier:</span>
          <span>{invoice.createdBy}</span>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '12px 0' }} />

      {/* Items */}
      <table style={{ width: '100%', fontSize: '12px', marginBottom: '12px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 'bold' }}>Item</th>
            <th style={{ textAlign: 'center', padding: '6px 4px', fontWeight: 'bold' }}>Qty</th>
            <th style={{ textAlign: 'center', padding: '6px 4px', fontWeight: 'bold' }}>Wt(kg)</th>
            <th style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 'bold' }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px dashed #ddd' }}>
              <td style={{ padding: '6px 4px' }}>{item.itemName}</td>
              <td style={{ textAlign: 'center', padding: '6px 4px' }}>{item.quantity}</td>
              <td style={{ textAlign: 'center', padding: '6px 4px' }}>{item.weight.toFixed(2)}</td>
              <td style={{ textAlign: 'right', padding: '6px 4px' }}>Rs. {item.totalPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '12px 0' }} />

      {/* Totals */}
      <div style={{ fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Subtotal:</span>
          <span>Rs. {invoice.subtotal.toFixed(2)}</span>
        </div>
        {invoice.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#16a34a' }}>
            <span>Discount:</span>
            <span>- Rs. {invoice.discount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', paddingTop: '8px', borderTop: '1px solid #333', marginTop: '8px' }}>
          <span>TOTAL:</span>
          <span>Rs. {invoice.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '12px 0' }} />

      {/* Payment */}
      <div style={{ fontSize: '12px', textAlign: 'center', marginBottom: '12px' }}>
        <p style={{ margin: '0' }}>Payment Method: <span style={{ textTransform: 'uppercase', fontWeight: '600' }}>{invoice.paymentMethod}</span></p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '12px 0' }} />

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
        <p style={{ fontWeight: '600', margin: '4px 0' }}>Thank you for shopping with us!</p>
        <p style={{ margin: '4px 0' }}>Fresh produce, smart checkout</p>
        <p style={{ marginTop: '8px' }}>* No returns on fresh produce *</p>
      </div>
    </div>
  );
};

export default InvoicePrint;
