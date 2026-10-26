const prisma = require("../src/db");
const { users, posts, likes } = require("./seed-data");

async function main() {
  // 1. Delete all rows from all three tables: children first
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create all users in one query and get created rows back
  const createdUsers = await prisma.user.createManyAndReturn({
    data: users.map((u) => ({
      username: u.username,
      email: u.email,
      fullname: u.fullname,
      bio: u.bio,
      isPrivate: u.isPrivate,
      createdAt: new Date(u.createdAt),
    })),
  });

  // 3. Build lookup: username -> id
  const userLookup = new Map();
  for (const user of createdUsers) {
    userLookup.set(user.username, user.id);
  }

  // 4. Create all posts in one query, replacing author with authorId
  const mappedPosts = posts.map((post) => ({
    imageUrl: post.imageUrl,
    caption: post.caption,
    location: post.location,
    createdAt: new Date(post.createdAt),
    authorId: userLookup.get(post.author),
  }));

  const createdPosts = await prisma.post.createManyAndReturn({
    data: mappedPosts,
  });

  // 5. Build lookup: insta## -> post id
  const postLookup = new Map();
  for (const post of createdPosts) {
    const instaKey = post.imageUrl.split("/")[4];
    postLookup.set(instaKey, post.id);
  }

  // 6. Create all likes in one query
  const mappedLikes = likes.map((like) => ({
    userId: userLookup.get(like.user),
    postId: postLookup.get(like.post),
  }));

  const createdLikes = await prisma.like.createManyAndReturn({
    data: mappedLikes,
  });

  // 7. Print seeded summary
  console.log(
    `🌱 Seeded ${createdUsers.length} users, ${createdPosts.length} posts and ${createdLikes.length} likes`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
