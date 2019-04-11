using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Dapper;



namespace ClayInspectionScheduler.Models
{

  public static class Constants
  {
    public const int appId = 20024;

    public static bool UseProduction()
    {
      switch (Environment.MachineName.ToUpper())
      {
        //case "CLAYBCCDV10":
        //// Test Environment Machines
        //  return false;

        
        //case "MISHL05":
        case "MISSL01":
        case "CLAYBCCIIS01":
        case "CLAYBCCDMZIIS01":
          // TODO: will need to add the DMZ machine name(s) here.
          return true;

        default:
          // we'll return false for any machinenames we don't know.
          return false;
      }
    }

    public static List<T> Get_Data<T>(string query)
    {
      try
      {
        using (IDbConnection db =
          new SqlConnection(
            Get_ConnStr("WATSC" + (UseProduction() ? "Prod" : "QA"))))
        {
          return (List<T>)db.Query<T>(query);
        }
      }
      catch (Exception ex)
      {
        Log(ex, query);
        return null;
      }
    }

    public static List<T> Get_Data<T>(string query, DynamicParameters dbA)
    {

      try
      {
        using (IDbConnection db =
          new SqlConnection(Get_ConnStr("WATSC" + (UseProduction() ? "Prod" : "QA"))))
        {
          return (List<T>)db.Query<T>(query, dbA);
        }
      }
      catch (Exception ex)
      {
        // TODO: no connection alert
        Log(ex, query);
        return null;
      }
    }

    public static int Exec_Query(string query, DynamicParameters dbA)
    {
      {
        try
        {
          using (IDbConnection db = new SqlConnection(Get_ConnStr("WATSC" + (UseProduction() ? "Prod" : "QA"))))
          {
            return db.Execute(query, dbA);
          }
        }
        catch (Exception ex)
        {
          Log(ex, query);
          return -1;
        }
      }
    }

    public static int Exec_Query_SP(string query, DynamicParameters dbA)
    {
      try // This function is for stored procedures
      {
        using (IDbConnection db = new SqlConnection(Get_ConnStr("WATSC" + (UseProduction() ? "Prod" : "QA"))))
        {
          return db.Execute(query, dbA, commandType: CommandType.StoredProcedure);
        }
      }
      catch (Exception ex)
      {
        Log(ex, query);
        return -1;
      }
    }

    public static T Execute_Scalar<T>(string query, DynamicParameters dbA)
    {
      {
        try
        {
          using (IDbConnection db = new SqlConnection(Get_ConnStr("WATSC" + (UseProduction() ? "Prod" : "QA"))))
          {
            return db.ExecuteScalar<T>(query, dbA);
          }
        }
        catch (Exception ex)
        {
          Log(ex, query);
          return default(T);
        }
      }
    }

    public static string Get_ConnStr(string cs)
    {
      return ConfigurationManager.ConnectionStrings[cs].ConnectionString;
    }

    #region Log Code

    public static void Log(Exception ex, string Query = "")
    {

      SaveLog(new ErrorLog(ex, Query));
    }

    public static void Log(string Text, string Message,
      string Stacktrace, string Source, string Query = "")
    {
      ErrorLog el = new ErrorLog(Text, Message, Stacktrace, Source, Query);
      SaveLog(el);
    }

    private static void SaveLog(ErrorLog el)
    {
      string sql = @"
      INSERT INTO ErrorData 
      (AppID, applicationName, errorText, errorMessage, 
      errorStacktrace, errorSource, query)  
      VALUES (@AppID, @applicationName, @errorText, @errorMessage,
      @errorStacktrace, @errorSource, @query);";


      using (IDbConnection db = new SqlConnection(Get_ConnStr("Log")))
      {
        db.Execute(sql, el);
      }

    }

    #endregion
  }

}