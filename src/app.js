const fs = require('fs'); // filesystem
const csv = require('csv-parse');// Encargado de parsear
const Promise = require('bluebird');
const pdf = Promise.promisifyAll(require('html-pdf'));

const parseador = csv({
    delimiter: ',',//Delimitador, por defecto es la coma ,
    cast: true, // Intentar convertir las cadenas a tipos nativos,
    relax_column_count: true,
    comment: '#' // El carácter con el que comienzan las líneas de los comentarios, en caso de existir,
});

var productos = [];
var fila;

// ALERTS LAYOUT

const alertError = (text) =>{
    console.log("\x1b[31m",text,"\x1b[0m");
}

const alertSuccess = (text) =>{
    console.log("\x1b[32m",text,"\x1b[0m");
}

//

parseador.on('readable', function () {
    while (fila = parseador.read()) {
        productos.push(fila);
    }
});



parseador.on('error', function (err) {
    alertError ("Error ->", err.message);
});


var myArgs = process.argv.slice(2);

if(myArgs[0] === undefined){

    alertError("No existe el csv: ", myArgs[0])

}else{


    if(fs.existsSync(`csv/${myArgs[0]}.csv`)){


        fs.createReadStream(`csv/${myArgs[0]}.csv`) 
        .pipe(parseador) 
        .on("end", function () {
            alertSuccess("Se ha terminado de leer el archivo");
            createPDF();
            parseador.end();
        }
    );
    }else{
        alertError("El archivo NO EXISTE!");
        
    }

 
}


createPDF = () =>{

    const formateador = new Intl.NumberFormat("en", { style: "currency", "currency": "EUR" });
    productos.shift();


    productos.forEach(function(producto){

        let contenidoHtml = fs.readFileSync("factura.html", 'utf8')

        contenidoHtml = contenidoHtml.replace("{{name}}", producto[6]);
        contenidoHtml = contenidoHtml.replace("{{dir}}", producto[9]);
        contenidoHtml = contenidoHtml.replace("{{ciudad}}", producto[10]);
        contenidoHtml = contenidoHtml.replace("{{correo}}", producto[12]);


        contenidoHtml = contenidoHtml.replace("{{numerofactura}}", producto[1]);
        contenidoHtml = contenidoHtml.replace("{{fecha}}", producto[4]);
        contenidoHtml = contenidoHtml.replace("{{numeropedido}}", producto[2]);
        contenidoHtml = contenidoHtml.replace("{{fechapedido}}", producto[4]);

        if (producto[14]  === undefined) {
            producto[14] = " -- ";

         }

        contenidoHtml = contenidoHtml.replace("{{pago}}", producto[14]);
        contenidoHtml = contenidoHtml.replace("{{id}}", producto[0]);

        contenidoHtml = contenidoHtml.replace("{{precio}}", producto[15]);

        contenidoHtml = contenidoHtml.replace("{{sub}}", producto[15]);
        contenidoHtml = contenidoHtml.replace("{{impuestos}}", producto[18]);
        contenidoHtml = contenidoHtml.replace("{{total}}", producto[17]);

        pdf.createAsync(contenidoHtml, { format: 'A4', filename: `facturas/${producto[1]}.pdf` })
        .then((pdf) => console.log(pdf));
        producto = []

    })


}

