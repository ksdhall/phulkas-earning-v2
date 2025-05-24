//src/types/Bill.ts
export interface Bill {
  id: string; 
  date: string; 
  foodAmount: number;
  drinkAmount: number;
  mealType: 'lunch' | 'dinner';
  isOurFood: boolean; 
  numberOfPeopleWorkingDinner: number;
  comments: string | "";
}
