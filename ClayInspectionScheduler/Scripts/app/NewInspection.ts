/// <reference path="transport.ts" />
/// <reference path="ui.ts" />

namespace InspSched
{
  interface INewInspection
  {
   PermitNo: string;
   InspectionCd: string;
   SchecDateTime: string;


  }

  export class NewInspection implements INewInspection
  {
    public PermitNo: string;
    public InspectionCd: string;
    public SchecDateTime: string;
    

    constructor()
    {

    }
  }
}