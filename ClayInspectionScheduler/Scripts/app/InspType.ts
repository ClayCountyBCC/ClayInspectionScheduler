/// <reference path="transport.ts" />
/// <reference path="ui.ts" />

namespace InspSched
{
  interface IInspType
  {
    InsDesc: string;
    InspCd: string;
    SubType: string;
    Final: boolean;


  }

  export class InspType implements IInspType
  {

    public InsDesc: string;
    public InspCd: string;
    public SubType: string;
    public Final: boolean;

    constructor()
    {

    }
  }
}