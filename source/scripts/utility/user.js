import { apiFetch } from './tumblr.js';

const fetchedUserInfo = await apiFetch('/v2/user/info').catch((error) => {
  console.error(error);
  return { response: {} };
});

/**
 * {object?} userInfo - The /v2/user/info API endpoint
 */
export const userInfo = fetchedUserInfo.response.user;

/**
 * {object[]} userBlogs - Array of blogs the user has posting permissions for
 */
export const userBlogs = userInfo?.blogs ?? [];

/**
 * {string[]} userBlogNames - Array of blog names the user has posting permissions for
 */
export const userBlogNames = userBlogs.map(blog => blog.name);

/**
 * {object?} primaryBlog - The user's main blog
 */
export const primaryBlog = userBlogs.find(blog => blog.primary === true);

/**
 * {string?} primaryBlogName - The user's main blog name
 */
export const primaryBlogName = primaryBlog?.name;

/**
 * {object[]} adminBlogs - Array of blogs the user has admin permissions for
 */
export const adminBlogs = userInfo?.blogs?.filter(blog => blog.admin) ?? [];

/**
 * {string[]} adminBlogNames -  Array of blog names the user has admin permissions for
 */
export const adminBlogNames = adminBlogs.map(blog => blog.name);
