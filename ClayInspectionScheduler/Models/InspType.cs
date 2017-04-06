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

    public static List<InspType> Get( string key )
    {
      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add( "@PermitNo", key );
     
      string sql = @"
        
        USE WATSC;

        DECLARE 
        @InspType CHAR(1) = 
          (SELECT PermitType 
          FROM 
            bpASSOC_PERMIT 
          WHERE 
            PermitNo = @PermitNo 
            
        UNION 
        
          SELECT 
            PermitType 
          FROM 
            bpMASTER_PERMIT 
          WHERE 
            PermitNo = @PermitNo )

        SELECT 
	        DISTINCT I.InsDesc InsDesc,
	        I.TYPE TYPE,
          I.InspCd
        FROM 
	        bpINS_REF I
        WHERE 
	        I.TYPE = @InspType AND 
	        I.Retired != 1 AND
	        I.InspCd != (@InspType + '00')
        ORDER BY 
	        I.InsDesc
        ";

      var lp = Constants.Get_Data<InspType>( sql, dbArgs );
      return lp;
    }



  }
}