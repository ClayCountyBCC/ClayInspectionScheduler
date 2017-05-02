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

    public static List<string> Post( NewInspection  thisInspection )
    {
      // thisInspection.SchecDateTime was being changed to local UTC Date via JSON.request.
      // This statement fixes that issue and reformats it to the expected date at 12:00:00 AM
      DateTime selectedDate = DateTime.Parse(thisInspection.SchecDateTime.ToShortDateString());

      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add( "@PermitNo", thisInspection.PermitNo );
      dbArgs.Add( "@InspCd", thisInspection.InspectionCd );
      dbArgs.Add( "@SelectedDate", selectedDate );

      if(thisInspection.PermitNo != null && 
         thisInspection.InspectionCd != null && 
         selectedDate != null)
      {
          string sql = @"
          
          USE WATSC;

          IF	SUBSTRING(@PermitNo,1,1)  =  SUBSTRING(@InspCd,1,1) AND
	          @InspCd IN (SELECT DISTINCT InspCd FROM bpINS_REF ) AND 
	          @SelectedDate >= CONVERT(DATE, GETDATE()) AND 
	          @SelectedDate != '' AND
	          @PermitNo IN (SELECT PERMITNO FROM (SELECT DISTINCT PERMITNO 
										          FROM bpASSOC_PERMIT 
										          WHERE PERMITNO = @PermitNo 
										          UNION 
									          SELECT DISTINCT PERMITNO 
										          FROM bpMASTER_PERMIT 
										          WHERE PERMITNO = @PermitNo)
									          AS TMP) AND
            @InspCd NOT IN (SELECT IR.InspectionCode FROM bpINS_REQUEST IR WHERE @PermitNo = IR.PermitNo AND IR.ResultADC IS NULL)

	          INSERT INTO bpINS_REQUEST
				          (PermitNo
				          ,InspectionCode
				          ,SchecDateTime)
			          VALUES
				          (@PermitNo
				          ,@InspCd
				          ,@SelectedDate)
          ELSE
	          SELECT 'Permit Does Not Exist'
	          WHERE @PermitNo not in (SELECT PERMITNO FROM (SELECT DISTINCT PERMITNO 
											          FROM bpASSOC_PERMIT 
											          WHERE PERMITNO = @PermitNo 
											          UNION 
										          SELECT DISTINCT PERMITNO 
											          FROM bpMASTER_PERMIT 
											          WHERE PERMITNO = @PermitNo) 
										          AS TMP)
	          UNION
	          SELECT 'Invalid Inspection Type'
	          WHERE substring(@PermitNo,1,1)  !=  SUBSTRING(@InspCd,1,1) OR 
			          @InspCd NOT IN (SELECT DISTINCT LTRIM(RTRIM(InspCd)) FROM bpINS_REF )
	          UNION
	          SELECT 'Invalid Date'
	          WHERE @SelectedDate < CONVERT(DATE, GETDATE()) OR @SelectedDate = ''
	          UNION
	          SELECT 'A Scheduled Inspection of This Type Exists for This Permit'
	          WHERE @InspCd IN (SELECT IR.InspectionCode FROM bpINS_REQUEST IR WHERE @PermitNo = IR.PermitNo AND IR.ResultADC IS NULL)

          ";

        List<string> li = Constants.Save_Data<string>( sql, dbArgs );
        return li;
     
      }
      else 
      {
        string sql = "";
        List<string> li = Constants.Save_Data<string>( sql, dbArgs );
        return li;
      }

    }

    public List<string> Validate(bool IsExternalUser)
    {
      // LET'S GET THE OLD MF PERMIT
      List<string> Errors = new List<string>();

      var Permits = (from p in Permit.Get(this.PermitNo, IsExternalUser)
                     where p.PermitNo == this.PermitNo
                     select p).ToList();

      Permit CurrentPermit;
      if(Permits.Count == 0)
      {
        Errors.Add("Permit number was not found.");
        return Errors;
      } else
      {
        CurrentPermit = Permits.First();
      }







      return Errors;
    }

    public bool Save()
    {
      // this function will save the inspection request.
      //if (this.Validate(IsExternalUser).Count > 0) return false;


    }
  }
}