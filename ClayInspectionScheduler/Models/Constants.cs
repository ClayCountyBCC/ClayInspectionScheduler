using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using Dapper;

namespace InspectionScheduler.Models
{

  public static class Constants
  {
    public const int appId = 20024;


    public static bool UseProduction()
    {
      switch (Environment.MachineName.ToUpper())
      {
        case "CLAYBCCDV10":
        case "MISML01":
        case "MISDW08":
          // Test Environment Machines
          Console.WriteLine("MachineName = " + Environment.MachineName.ToUpper());
          return false;

        case "CLAYBCCIIS01":
        case "CLAYBCCDMZIIS01":
          Console.WriteLine("MachineName = " + Environment.MachineName.ToUpper());
          // TODO: will need to add the DMZ machine name(s) here.
          return false;

        default:
          Console.WriteLine("MachineName = " + Environment.MachineName.ToUpper());
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
          new SqlConnection(
            Get_ConnStr("WATSC" + (UseProduction() ? "Prod" : "QA"))))
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

    public static List<T> Save_Data<T>(string insertQuery)
    {
      try
      {
        using (IDbConnection db = new SqlConnection(Get_ConnStr("Printing")))
        {
          return ( List<T> )db.Query<T>( insertQuery);
        }
      }
      catch (Exception ex)
      {
        Log(ex, insertQuery);
        return null;
      }
    }

    public static List<T> Save_Data<T>( string query, DynamicParameters dbA )
    {
      {
        try
        {
          using( IDbConnection db = new SqlConnection( Get_ConnStr( "WATSC" + ( UseProduction() ? "Prod" : "QA" ) ) ) )
          {
            return ( List<T> )db.Query<T>( query, dbA );

          }
        }
        catch( Exception ex )
        {
          Log( ex, query );
          return null;
        }
      }
    }

    public static bool Delete_Data<T>(string query, DynamicParameters dbA)
    {
      {
        try
        {
          using (IDbConnection db = new SqlConnection(Get_ConnStr("WATSC" + (UseProduction() ? "Prod" : "QA"))))
          {
            db.Execute(query, dbA);
            return true;
          }
        }
        catch (Exception ex)
        {
          Log(ex, query);
          return false;
        }
      }
    }

    public static string Get_ConnStr(string cs)
    {
      return ConfigurationManager.ConnectionStrings[cs].ConnectionString;
    }

    public static bool CheckIsExternalUser()
    {

      return true;
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