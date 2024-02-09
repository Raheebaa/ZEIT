const ejs = require('ejs')
const pdf = require('html-pdf')
const fs = require('fs')
const exceljs = require('exceljs')
const { format: dateFormat } = require('date-fns');
const productUpload = require('../models/productSchema');

const download = async (req, res, orders, startDate, endDate, totalSales, format) => {
    const formattedStartDate = dateFormat(new Date(startDate), 'yyyy-MM-dd');
    const formattedEndDate = dateFormat(new Date(endDate), 'yyyy-MM-dd');
    
    try {
        console.log('Orders:', orders);
        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);
        console.log('Total Sales:', totalSales);
        const totalAmount = parseInt(totalSales);

        // Read the HTML template file
        const template = fs.readFileSync('util/template.ejs', 'utf-8');
        
        // Render HTML using EJS
        const html = ejs.render(template, { orders, startDate, endDate, totalAmount });

        if (format === 'pdf') {
            const pdfOptions = {
                format: 'Letter',
                orientation: 'portrait',
            };
            const filePath = `public/salesReport/pdf/sales-report-${formattedStartDate}-${formattedEndDate}.pdf`;

            // Generate PDF
            pdf.create(html, pdfOptions).toFile(filePath, (err, response) => {
                if (err) {
                    console.error('Error generating PDF:', err);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.status(200).download(response.filename);
                }
            });

        }else if(format ==='excel'){
            // console.log(orders,"order")
            const workbook = new exceljs.Workbook()
            const worksheet = workbook.addWorksheet('sales Report');

            worksheet.columns =[
                { header: 'Order ID', key: 'orderId', width: 25 },
                { header: 'Product Name', key: 'productName', width: 25 },
                { header: 'User name', key: 'userId', width: 25},
                { header: 'Date', key: 'date', width: 25 },
                { header: 'Total Amount', key: 'totalamount', width: 25 },
                { header: 'Payment Method', key: 'paymentmethod', width: 25 },
            ]
            let totalSalesAmount = 0
            for (const order of orders) {
                // console.log(order,"order");
                for (const item of order.Items) {
                    // console.log(item,"item");
                    worksheet.addRow({
                        orderId: order.orderId,
                        productName: order.productDetails.ProductName,
                        userId: order.username,
                        date: order.OrderDate ? new Date(order.OrderDate).toLocaleDateString() : '',
                        totalamount: order.TotalPrice !== undefined ? order.TotalPrice.toFixed(2) : '',
                        paymentmethod: order.paymentMethod,
                    })
                    totalSalesAmount += order.TotalPrice !== undefined ? order.TotalPrice : 0;
                }
            }
            worksheet.addRow({totalamount:'total sales amount', paymentmethod: totalSalesAmount.toFixed(2)})
            const excelPath = `public/salesReport/excel/sales-Report-${formattedStartDate}-${formattedEnddDate}.xlsx`
            await workbook.xlsx.writeFile(excelPath);

            res.status(200).download(excelPath)

        }else{
            res.status(404).send("invalid download format")
        }
    }
    catch(err){
        console.log(err);
    }
}

module.exports={
    download,
}

