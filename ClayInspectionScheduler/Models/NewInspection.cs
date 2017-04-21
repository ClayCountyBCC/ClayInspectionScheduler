using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace InspectionScheduler.Models
{
  public class NewInspection
  {
    public string PermitNo { get; set; } = "";

    public string InspectionCd { get; set; } = "";

    public DateTime SchecDateTime { get; set; } 

    public NewInspection(string PermitNo, string InspectionCd, DateTime SchecDateTime)
    {
      this.PermitNo = PermitNo;
      this.InspectionCd = InspectionCd;
      this.SchecDateTime = SchecDateTime;
    }

    public static bool Post(NewInspection thisInspection)//string newInspData)
    {
      //var data = newInspData.Split( ',' );
      //var dbArgs = new Dapper.DynamicParameters();
      //dbArgs.Add( "@PermitNo", data[ 0 ] );
      //dbArgs.Add( "@InspCd", data[ 1 ] );
      //dbArgs.Add( "@SelectedDate", data[ 2 ] );
      //if( data[ 0 ] != null && data[ 1 ] != null && data[ 2 ] != null )

      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add( "@PermitNo", thisInspection.PermitNo );
      dbArgs.Add( "@InspCd", thisInspection.InspectionCd );
      dbArgs.Add( "@SelectedDate", thisInspection.SchecDateTime );

      if(thisInspection.PermitNo != null && thisInspection.InspectionCd != null && thisInspection.SchecDateTime != null &&thisInspection.PermitNo[0]==thisInspection.InspectionCd[0])
      {


          string sql = @"";

        var li = Constants.Save_Data<NewInspection>( sql, dbArgs );
        return true;
      }
      else 
      {

        return false;
      }

    }

  }
}