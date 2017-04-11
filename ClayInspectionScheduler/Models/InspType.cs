using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace InspectionScheduler.Models
{
  public class InspType
  {
    public string InsDesc { get; set; }

    public string TYPE { get; set; }

    public string InspCd{ get; set; }

    public static List<InspType> Get( )
    {
     
      string sql = @"
        
        USE WATSC;

        SELECT
          DISTINCT I.InsDesc,
          I.InspCd
        FROM
                bpINS_REF I
        WHERE
                I.Retired != 1
          AND RIGHT(RTRIM(InspCd),2) != '00'
        ORDER BY 
          I.InsDesc
        ";

      var lp = Constants.Get_Data<InspType>( sql );
      return lp;
    }



  }
}