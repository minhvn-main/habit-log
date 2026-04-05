
// Define colors for persons
const PERSON_COLORS = [
  "bg-emerald-500",
  "bg-blue-500", 
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-teal-500",
  "bg-cyan-500"
];

export const getPersonColor = (person: string, allPersons: string[]): string => {
  if (person === "myself") {
    return "bg-primary";
  }
  
  // Find index of person in sorted list for consistent color assignment
  const sortedPersons = [...allPersons].sort();
  const index = sortedPersons.indexOf(person);
  return PERSON_COLORS[index % PERSON_COLORS.length];
};

export const getPersonInitial = (person: string): string => {
  if (person === "myself") {
    return "M";
  }
  return person.charAt(0).toUpperCase();
};

export const getPersonLabel = (person: string): string => {
  if (person === "myself") {
    return "Myself";
  }
  return person;
};
