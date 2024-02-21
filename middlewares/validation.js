const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const ajv = new Ajv();
addFormats(ajv);

function userLoginValidation(req, res, next) {
    const { email, password } = req.body;
    const schema = {
        type: "object",
        properties: {
            email: {
                type: "string",
                format: "email"
            },
            password: {
                type: "string",
                maxLength: 16,
                minLength: 8
            }
        },
        required: ["email", "password"],
        additionalProperties: false
    }
    const validate = ajv.compile(schema);
    const valid = validate({ email, password });
    if (!valid) {
        res.status(400).json({ error: 'Bad request' });
    } else {
        next();
    }
}

module.exports = {
    userLoginValidation
};