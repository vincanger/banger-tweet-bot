import type { UpdateSettings } from "@wasp/actions/types";
import HttpError from '@wasp/core/HttpError.js';

export const updateSettings: UpdateSettings<{favUsers: string[]}, Promise<{ favUsers: string[]}>> = async ({ favUsers }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  try {
    return await context.entities.User.update({
      where: {
        id: context.user.id,
      },
      data: {
        favUsers: favUsers,
      },
      select: {
        favUsers: true,
      },
    });
  }catch (error) {
    throw new HttpError(500, error);
  }
};
