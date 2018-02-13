namespace InspSched
{
  interface IShortInspection
  {
    InspectionId: number;
    InspectionDesc: string;
  }

  export class ShortInspection implements IShortInspection
  {
    constructor(public InspectionId: number, public InspectionDesc: string)
    {

    }
  }
}