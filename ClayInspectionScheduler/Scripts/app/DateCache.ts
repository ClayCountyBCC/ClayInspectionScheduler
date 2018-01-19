/// <reference path="ui.ts" />

namespace InspSched
{
  interface IDateCache
  {
    minDate_string: string;
    maxDate_string: string;
    badDates_string: string[];



  }

  export class DateCache implements IDateCache
  {
    public minDate_string: string;
    public maxDate_string: string;
    public badDates_string: string[];

    constructor()
    {

    }
  }
}