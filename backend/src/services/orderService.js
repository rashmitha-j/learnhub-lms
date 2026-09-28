import ApiError from '../utils/ApiError.js';

// Sets `order` to each id's position in `ids`. The ids must be exactly the existing set
// matched by `filter`, so a reorder can never move items between parents.
export const applyOrder = async (Model, filter, ids) => {
  const existing = new Set((await Model.find(filter).distinct('_id')).map(String));
  const requested = new Set(ids.map(String));

  const sameSet =
    requested.size === ids.length &&
    requested.size === existing.size &&
    [...requested].every((id) => existing.has(id));

  if (!sameSet) throw ApiError.badRequest('The list must contain each item exactly once');

  await Model.bulkWrite(
    ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index } } } }))
  );
};
