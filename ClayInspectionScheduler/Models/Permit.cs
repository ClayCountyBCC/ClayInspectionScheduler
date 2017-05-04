using System;
using System.Collections.Generic;
using Dapper;

namespace InspectionScheduler.Models
{
  public class Permit
  {
    static bool PermitCheck { get; set; }
    private bool IsExternalUser { get; set; }
    public string PermitNo { get; set; }
    public string ProjAddrCombined { get; set; }
    public string ProjCity { get; set; }
    public DateTime SuspendGraceDt { get; set; }

    public void SetIsExternalUser() { this.IsExternalUser = Constants.CheckIsExternalUser(); }
    public bool GetIsExternalUser(){ return this.IsExternalUser; }
    public List<string> ScheduleDates {
      get
      {
        return Dates.GenerateShortDates(IsExternalUser, SuspendGraceDt);
      }
    }

    public string FailType { get; set; }

    public string CanSchedule
    {
      get
      {
        switch (FailType)
        {
          case "C":
          case "H":
          case "F":
            return "FAIL";
          //string fail = FailType;
          // return fail;
          default:
            return "PASS";
        }
      }
    }
    
    public Permit()
    {

    }

    public static List<Permit> Get(string AssocKey, bool IsExternalUser)
    {

      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@PermitNo", AssocKey);

      string sql = @"
        USE WATSC;
        DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);
          CREATE TABLE #Fail 
        (
        PermitNo CHAR(8),
        FailType CHAR(1) -- 'C' for Charge, 'H' for Hold
        );
        INSERT INTO #Fail 
            SELECT DISTINCT AssocKey, 'C'
            FROM ccCashierItem 
            WHERE (@PermitNo = AssocKey 
            OR @MPermitNo = AssocKey 
            OR AssocKey IN (SELECT PermitNo FROM bpASSOC_PERMIT WHERE MPermitNo = @PermitNo))
            AND Total > 0 
            AND CashierId IS NULL 
            AND UnCollectable = 0
            AND AssocKey NOT IN (SELECT PermitNo FROM #Fail);
        INSERT INTO #Fail 
            SELECT DISTINCT PermitNo, 'H'
            FROM bpHOLD H   
            WHERE (@PermitNo = PermitNo
            OR @MPermitNo = PermitNo
            OR PermitNo IN (SELECT PermitNo FROM bpASSOC_PERMIT WHERE MPermitNo = @PermitNo))    
            AND HldDate IS NULL
            AND PermitNo NOT IN (SELECT PermitNo FROM #Fail);
        INSERT INTO #Fail 
        SELECT 
            PermitNo, 
            FailType FROM (
        SELECT 
            A.PermitNo,
            'F' AS FailType
        FROM bpASSOC_PERMIT A
        INNER JOIN clContractor C ON A.ContractorId = C.ContractorCd
        WHERE (A.PermitNo = @PermitNo 
	          OR A.MPermitNo = @MPermitNo
              OR PermitNo IN 
	          (SELECT 
		        PermitNo 
	          FROM 
		        bpASSOC_PERMIT 
	          WHERE MPermitNo = @PermitNo 
	            OR MPermitNo IN 
			        (SELECT PermitNo
    		          FROM 
				        bpMASTER_PERMIT 
			          WHERE
				        CoClosed = 1 AND 
				        PermitNo LIKE '1%')))     
        UNION ALL
        SELECT M.PermitNo,
            'F' AS FailType
        FROM bpMASTER_PERMIT M
        INNER JOIN bpBASE_PERMIT B 
        INNER JOIN clContractor C ON B.ContractorId = C.ContractorCd
        ON M.BaseID = B.BaseID
        WHERE M.CoClosed = 1
	        and( (M.PermitNo = @PermitNo 
		        OR M.PermitNo = @MPermitNo)
	        OR(C.Status <> 'A' 
            OR C.LiabInsExpDt < GETDATE()
            OR C.WC_ExpDt < GETDATE())	
		        and( (M.PermitNo = @PermitNo 
			        OR M.PermitNo = @MPermitNo) ))
        ) AS M
        WHERE PermitNo NOT IN (SELECT PermitNo FROM #Fail);
        SELECT 
          TMP.*, 
          ISNULL(F.FailType, '') FailType
        FROM (
            SELECT 
            M.PermitNo PermitNo,
            M.PermitNo MPermitNo,
            B.ProjAddrCombined,
            B.ProjCity,
			      M.PermitType,
            CASE WHEN CAST(C.SuspendGraceDt AS DATE) < CAST(GETDATE() AS DATE)
            THEN NULL 
            ELSE CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) END SuspendGraceDt
            FROM bpMASTER_PERMIT M
            INNER JOIN bpBASE_PERMIT B ON M.BaseID = B.BaseID
            INNER JOIN clContractor C ON B.ContractorId = C.ContractorCd 
            UNION ALL
            SELECT 
            A.PermitNo PermitNo,
            ISNULL(A.MPermitNo, A.PermitNo) MPermitNo,
            B.ProjAddrCombined,
            B.ProjCity,
			      A.PermitType,
            CASE WHEN CAST(C.SuspendGraceDt AS DATE) < CAST(GETDATE() AS DATE)
            THEN NULL 
            ELSE CAST(DATEADD(dd, 15, C.SuspendGraceDt) AS DATE) END SuspendGraceDt
            FROM bpASSOC_PERMIT A
            INNER JOIN bpBASE_PERMIT B ON A.BaseID = B.BaseID
            INNER JOIN clContractor C ON A.ContractorId = C.ContractorCd 
        ) AS TMP
        LEFT OUTER JOIN #Fail F ON TMP.PermitNo = F.PermitNo
        WHERE MPermitNo = @MPermitNo
            OR MPermitNo = @PermitNo
        DROP TABLE #Fail;";
      try
      {
        var lp = Constants.Get_Data<Permit>(sql, dbArgs);
        // let's set the isExternalUser field here
        foreach (Permit p in lp)
        {
          p.IsExternalUser = IsExternalUser;
        }
        return lp;
      }
      catch(Exception ex)
      {
        Constants.Log(ex);
        return null;
      }


    }



  }
}