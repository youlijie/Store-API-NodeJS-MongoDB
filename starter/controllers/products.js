const Product = require("../models/product")
const { search } = require("../routes/products")

const getAllProductsStatic = async (req, res) => {
    const products = await Product.find({}).sort("name").select("name price").limit(10).skip(5)
    res.status(200).json({ products, nbHits: products.length })
}

const getAllProducts = async (req, res) => {
    const {featured, company, name, sort, fields, numericFilters} = req.query
    const queryObject = {}
    if(featured){
        queryObject.featured = featured === "true" ? true : false
    }
    if(company){
        queryObject.company = company
    }

    if(name){
        queryObject.name = { $regex: name, $option: "i" }
    }

    if(numericFilters){
        const operatorMap = {
            ">":"$gt",
            ">=":"$gte",
            "=":"$eq",
            "<":"$lt",
            "<=":"$lte",
        }
        const regEx = /\b(<|>|>=|=|<=)\b/g
        let filters = numericFilters.replace(regEx,(match)=>`-${operatorMap[match]}-`)
        const option = ["price", "rating"]
        filters = filters.split(",").forEach((item)=> {
            const [field, operator, value] = item.split("-")
            if(option.includes(field)){
                queryObject[field] = {[operator]: Number(value) }
            }
        })
    }

    let result = Product.find(queryObject)
    // sort
    if(sort){
        const sortList = sort.split(',').join(' ')
        result = result.sort(sortList)
    } else {
        result = result.sort('createAt')
    }

    if(fields){
        const fieldList = fields.split(',').join(' ')
        result = result.select(fieldList)
    }

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    result = result.skip(skip).limit(limit)


    const products = await result
    res.status(200).json({ products, nbHits: products.length })
}

module.exports = {
    getAllProductsStatic,
    getAllProducts
}