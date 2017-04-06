/// <reference path="transport.ts" />
/// <reference path="ui.ts" />

namespace InspSched
{
  interface IDates
  {
    disabledDatesString: string;
    minDate: string;

  }

  export class Dates implements IDates
  {

    public disabledDatesString: string;
    public minDate: string


    constructor()
    {


    }
  }

}