// remove dynamic properties to match snapshots
function filterDynamic(serialized) {
  if (Array.isArray(serialized)) {
    return serialized.map(u => {
      const { createdAt: eca, ...filteredSerialized } = u
      return filteredSerialized
    })
  }
  const { createdAt: eca, ...filteredSerialized } = serialized
  return filteredSerialized
}

export {
  filterDynamic
}