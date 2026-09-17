export async function checkExisting({
  model,
  msg = `${model} not found`,
  statusCode = 404,
  searchParameter,
  options,
  isTrue = false,
}) {
  const object = await model.findOne({
    where: searchParameter,
    ...options,
  });
  if (isTrue) {
    if (object) throw new Error(msg, { cause: statusCode });
    return object;
  }
  if (!object) throw new Error(msg, { cause: statusCode });
  return object;
}

export function isTheOwner({ section, professorId }) {
  if (section.professorId !== professorId)
    throw new Error("You dont own this section", { cause: 403 });
}
