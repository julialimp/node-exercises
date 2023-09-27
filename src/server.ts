import express from "express";
import { PrismaClient } from "@prisma/client";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc"
        },
        include: {
            languages: true,
            genres: true,
        },
    });
    const totalMovies = movies.length;

    let totalDuration = 0;
    for (let movie of movies) {
        totalDuration += movie.duration;
    }
    const averageDuration = totalMovies > 0 ? totalDuration / totalMovies : 0;

    res.json({
        totalMovies,
        averageDuration,
        movies
    });
});

app.put("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);
    const data = { ...req.body };
    console.log(data);

    try {
        const movie = await prisma.movie.findUnique({
            where: { id }
        });
        if (!movie) {
            return res.status(404).send({ message: "Movie not found" });
        }

        await prisma.movie.update({
            where: { id },
            data
        });
        res.status(200).send({ message: "Movie updated successfully" });

    } catch (error) {
        return res.status(500).send({ message: "Failed to update data" });
    }
});

app.get("/genres", async (_, res) => {
    try {
        const genres = await prisma.genre.findMany({
            orderBy: {
                name: "asc",
            }
        });
        res.json(genres);
    } catch (error) {
        res.status(500).send({ message: "There was a problem trying to search genres" });
    }
});

app.put("/genres/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name } = req.body;

    try {
        const genre = await prisma.genre.findUnique({
            where: { id }
        });
        if (!genre) {
            return res.status(404).send({ message: "Genre not found" });
        }

        const existingGenre = await prisma.genre.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
                id: { not: id }
            }
        });
        if (existingGenre) {
            return res.status(409).send({ message: "This genre name already exists." });
        }

        const updateGenre = await prisma.genre.update({
            where: { id },
            data: { name }
        });

        res.status(200).json(updateGenre);

    } catch (error) {
        return res.status(500).send({ message: "Failed to update data" });
    }
});

app.post("/genres", async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).send({ message: "Genre name needs to be informed" });
    }

    try {
        const existingGenre = await prisma.genre.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
            }
        });
        if (existingGenre) {
            return res.status(409).send({ message: "This genre name already exists." });
        }

        const createGenre = await prisma.genre.create({
            data: {
                name
            }
        });
        res.status(201).json(createGenre);

    } catch (error) {
        return res.status(500).send({ message: "Failed to create genre" });
    }
});

app.delete("/genres/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const genre = await prisma.genre.findUnique({
            where: { id }
        });
        if (!genre) {
            return res.status(404).send({ message: "Genre not found" });
        }

        await prisma.genre.delete({
            where: { id }
        });
        res.status(200).send({ message: "Genre removed successfully" });
    } catch (error) {
        return res.status(500).send({ message: "Failed to remove genre" });
    }
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});