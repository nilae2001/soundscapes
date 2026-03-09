import * as z from "zod";

const soundscapeSchema = z.object({
  title: z.string().max(20).trim(),
  description: z.string().max(150).trim(),
  image_url: z.string().trim(),
});

export default soundscapeSchema;
