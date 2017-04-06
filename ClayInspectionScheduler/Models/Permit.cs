using System.Collections.Generic;


namespace InspectionScheduler.Models
{
  public class Permit
  {
    static bool PermitCheck { get; set; }
    public string PermitNo { get; set; }
    public string ProjAddrCombined { get; set; }
    public string ProjCity { get; set; }
    public string PermitType { get; set; }
    public string PermitTypeDisplay
    {
      get
      {
        switch ( PermitType )
        {
          case "0":
          case "1":
          case "9":
            return "Building Master";
          case "2":
            return "Electrical";
          case "3":
            return "Plumbing";
          case "4":
            return "Mechanical";
          case "6":
            return "Fire";
          default:
            return "Unknown";
        }
      }
    }

    public string FailType { get; }

    public string CanSchedule
    {
      get
      {
        switch ( FailType )
        {
          case "C":
          case "H":
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

    public static List<Permit> Get( string AssocKey )
    {

      double testNum = 0.0;
      var dbArgs = new Dapper.DynamicParameters ( );
      dbArgs.Add ( "@PermitNo", AssocKey );

      if ( AssocKey.Length == 8 && double.TryParse ( AssocKey, out testNum ) )
      {

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

                SELECT TMP.*, ISNULL(F.FailType, '') FailType
                FROM (
                    SELECT 
                    M.PermitNo PermitNo,
                    M.PermitNo MPermitNo,
                    B.ProjAddrCombined,
                    B.ProjCity,
				            M.PermitType
                    FROM bpMASTER_PERMIT M
                    INNER JOIN bpBASE_PERMIT B ON M.BaseID = B.BaseID
                    UNION ALL
                    SELECT 
                    A.PermitNo PermitNo,
                    ISNULL(A.MPermitNo, A.PermitNo) MPermitNo,
                    B.ProjAddrCombined,
                    B.ProjCity,
				            A.PermitType
                    FROM bpASSOC_PERMIT A
                    INNER JOIN bpBASE_PERMIT B ON A.BaseID = B.BaseID
                ) AS TMP
                LEFT OUTER JOIN #Fail F ON TMP.PermitNo = F.PermitNo
                WHERE MPermitNo = @MPermitNo
                    OR MPermitNo = @PermitNo

                DROP TABLE #Fail;";
        var lp = Constants.Get_Data<Permit> ( sql, dbArgs );
        return lp;

      }
      else
      {
        string sql = @"";

        var lp = Constants.Get_Data<Permit> ( sql, dbArgs );
        return lp;
      }

    }

  }
}