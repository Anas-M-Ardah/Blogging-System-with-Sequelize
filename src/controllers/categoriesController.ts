import { Request, Response } from 'express';
import { Categories } from '../models/categoriesModel.js';
import { PostsCategories } from '../models/postsCategoriesModel.js';
import Joi from 'joi';

// Define an interface for the category data
interface CategoryData {
    description: string;
    postId: number;
}

// Validation schema for category data
const categoryDataSchema = Joi.object({
    description: Joi.string().required(),
    postId: Joi.number().required(),
});

// Create categories table
export const createCategoriesTable = async (req: Request, res: Response): Promise<void> => {
    try {
        await Categories.sync();
        res.status(200).json({ message: "Categories table created" });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Create a new category for a post by ID
export const createCategory = async (req: Request<{}, {}, CategoryData>, res: Response): Promise<void> => {
    try {
        const { description, postId } = req.body;
        const { error } = await categoryDataSchema.validateAsync({ description, postId });
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        const category = await Categories.create({ description, postId }) as any; // Adjust type if necessary
        const postCategories = await PostsCategories.create({ postId, categoryId: category.id });
        res.status(201).json({ category, postCategories });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Get categories for a specific post by ID
export const getCategoriesByPostId = async (req: Request<{ postId: string }>, res: Response): Promise<void> => {
    try {
        const { postId } = req.params;
        if (!postId || isNaN(Number(postId))) {
            return res.status(400).json({ error: "Invalid post ID format" });
        }

        const categories = await PostsCategories.findAll({ where: { postId } });

        if (!categories || categories.length === 0) {
            return res.status(404).json({ error: "Categories not found" });
        }

        res.status(200).json(categories);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: "An unknown error occurred" });
        }
    }
};