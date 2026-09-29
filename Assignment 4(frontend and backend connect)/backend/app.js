import express from "express";
import cors from "cors";
import pg from "pg";
import "dotenv/config";

const app = express();

app.use(cors({}));
app.use(express.json());

const { Pool } = pg;
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  //   ssl: {
  //     rejectUnauthorized: false,
  //   },
});

try {
  const client = await db.connect();
  console.log("connection successfully to the db");
  client.release();
} catch (error) {
  console.log("something went wrong", error);
}

const ALLOWED_SORT_COLUMNS = ["id", "name", "created_at", "price"];

// GET PRODUCTS
app.get("/api/products", async (req, res) => {
  try {
    // Page
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    // Limit
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit, 10) || 10),
    );

    // Offset
    const offset = (page - 1) * limit;

    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sortBy)
      ? req.query.sortBy
      : "created_at";

    const sortOrder =
      req.query.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const search = req.query.search || null;

    const category = req.query.category || null;

    const whereClauses = [];

    const queryParams = [];

    if (search) {
      queryParams.push(`%${search}%`);

      whereClauses.push(`name ILIKE $${queryParams.length}`);
    }

    if (category) {
      queryParams.push(category);

      whereClauses.push(`category = $${queryParams.length}`);
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countQuery = `
            SELECT COUNT(*)
            FROM products
            ${whereSql}
        `;

    const countResult = await db.query(countQuery, queryParams);

    const totalItems = parseInt(countResult.rows[0].count, 10);

    const limitParamIndex = queryParams.length + 1;

    const offsetParamIndex = queryParams.length + 2;

    const dataQueryParams = [...queryParams, limit, offset];

    const dataQuery = `
            SELECT
                id,
                name,
                category,
                price,
                created_at
            FROM products

            ${whereSql}

            ORDER BY ${sortBy} ${sortOrder}

            LIMIT $${limitParamIndex}
            OFFSET $${offsetParamIndex}
        `;

    const dataResult = await db.query(dataQuery, dataQueryParams);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: dataResult.rows,

      pagination: {
        totalItems,

        totalPages,

        currentPage: page,

        limit,

        hasNextPage: page < totalPages,

        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
