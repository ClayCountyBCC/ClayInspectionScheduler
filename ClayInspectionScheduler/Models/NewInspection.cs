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

    public static bool Post( NewInspection  thisInspection )
    {
      // thisInspection.SchecDateTime was being changed to local UTC Date via JSON.request.
      // This statement fixes that issue and is now reformatted to the expected date at 12:00:00 AM
      DateTime selectedDate = DateTime.Parse(thisInspection.SchecDateTime.ToShortDateString());

      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add( "@PermitNo", thisInspection.PermitNo );
      dbArgs.Add( "@InspCd", thisInspection.InspectionCd );
      dbArgs.Add( "@SelectedDate", selectedDate );

      if(thisInspection.PermitNo != null && 
         thisInspection.InspectionCd != null && 
         selectedDate != null &&  
         thisInspection.PermitNo[0] == thisInspection.InspectionCd[0])
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