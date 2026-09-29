let cards = [
  {
    id: 1,
    title: "paranjay chaudhary",
    role: "FullStack Developer",
    description:
      "Apprenticeship on skill shikshya. Completed Frontend and now Learning Backend for becoming a MERN Stack Developer",
    image: "/img/paaran.jpg",
  },
  {
    id: 2,
    title: "Anuj chaudhary",
    role: "FullStack Developer",
    description:
      "He is a Hero of our class, Always rocks and not only this he is also my best friend. We are together since bachelor day 1",
    image: "/img/Anuj.jpg",
  },
  {
    id: 3,
    title: "Aayush Karn",
    role: "Frontend Developer",
    description:
      "He is a also a Hero of our class. He is also my friend and we explore different waterfalls together.",
    image: "/img/aayush.jpg",
  },
];

let nextId = 4;

export const HomeRoute = (req, res, next) => {
  res.render("index", { cards });
};

export const getApiCards = (req, res, next) => {
  res.json(cards);
};

export const getCardsThroughId = (req, res, next) => {
  const card = cards.find((c) => c.id === Number(req.params.id));
  if (!card) return res.status(404).json({ error: "card not found" });
  res.json(card);
};

export const postCards = (req, res, next) => {
  const { title, role, description, image } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "title and description is required" });
  }

  const newCard = {
    id: nextId++,
    title,
    role,
    description,
    image,
  };

  cards.push(newCard);
  res.status(201).json(newCard);
};

export const Error = (req, res) => {
  res.status(404).send("404 not found");
};
