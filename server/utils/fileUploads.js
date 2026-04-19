// server/utils/fileUploads.js

const { Formidable } = require('formidable');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Server: Created upload directory: ${UPLOAD_DIR}`); // DEBUG LOG A
}

function parseMultipartFormData(req) {
    console.log('Server: Entering parseMultipartFormData...'); // DEBUG LOG B
    return new Promise((resolve, reject) => {
        const form = new Formidable({
            uploadDir: UPLOAD_DIR,
            keepExtensions: true,
            maxFileSize: 5 * 1024 * 1024,
            filename: (name, ext, part, form) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const originalFilename = part.originalFilename;
                const fileExtension = path.extname(originalFilename);
                const baseName = path.basename(originalFilename, fileExtension);
                const newFileName = `${baseName.substring(0, 30)}-${uniqueSuffix}${fileExtension}`;
                console.log(`Server: Generating filename: ${newFileName}`); // DEBUG LOG C
                return newFileName;
            }
        });

        // Add event listeners for formidable for more detailed debugging
        form.on('fileBegin', (name, file) => {
            console.log(`Server: Formidable - Starting file upload: ${file.originalFilename}`); // DEBUG LOG D
        });

        form.on('file', (name, file) => {
            console.log(`Server: Formidable - File uploaded: ${file.originalFilename} to ${file.filepath}`); // DEBUG LOG E
        });

        form.on('field', (name, value) => {
            console.log(`Server: Formidable - Field received: ${name} = ${value}`); // DEBUG LOG F
        });

        form.on('error', err => {
            console.error('Server: Formidable - Parsing error:', err); // DEBUG LOG G
            reject(err);
        });

        form.on('end', () => {
            console.log('Server: Formidable - Parsing finished.'); // DEBUG LOG H
        });

        form.parse(req, (err, fields, files) => {
            console.log('Server: Formidable - parse callback invoked.'); // DEBUG LOG I
            if (err) {
                console.error('Server: Error in form.parse callback:', err); // DEBUG LOG J
                return reject(err);
            }
            console.log('Server: Raw fields from formidable:', fields); // DEBUG LOG K
            console.log('Server: Raw files from formidable:', files); // DEBUG LOG L

            const parsedFields = {};
            for (const key in fields) {
                parsedFields[key] = fields[key][0];
            }

            const parsedFiles = {};
            for (const key in files) {
                parsedFiles[key] = files[key][0];
            }
            console.log('Server: parseMultipartFormData resolving...'); // DEBUG LOG M
            resolve({ fields: parsedFields, files: parsedFiles });
        });
    });
}

module.exports = {
    parseMultipartFormData
};