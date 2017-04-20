/// <reference path="transport.ts" />
/// <reference path="ui.ts" />

namespace InspSched
{
  interface IInspType
  {
    InsDesc: string;
    InspCd: string;



  }

  export class InspType implements IInspType
  {

    public InsDesc: string;
    public InspCd: string;


    constructor()
    {

    }
  }
}