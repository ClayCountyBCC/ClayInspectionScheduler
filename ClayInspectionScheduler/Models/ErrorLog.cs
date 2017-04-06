using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace InspectionScheduler.Models
{
  public class ErrorLog
  {
    public int AppId { get; set; } = Constants.appId;
    public string ApplicationName { get; set; } = "InspSched";
    public string ErrorText { get; set; }
    public string ErrorMessage { get; set; }
    public string ErrorStacktrace { get; set; }
    public string ErrorSource { get; set; }
    public string Query { get; set; }

    public ErrorLog(string text,
      string message,
      string stacktrace,
      string source,
      string errorQuery)
    {
      ErrorText = text;
      ErrorMessage = message;
      ErrorStacktrace = stacktrace;
      ErrorSource = source;
      Query = errorQuery;
    }

    public ErrorLog(Exception ex, string errorQuery = "")
    {
      ErrorText = ex.ToString();
      ErrorMessage = ex.Message;
      ErrorStacktrace = ex.StackTrace;
      ErrorSource = ex.Source;
      Query = errorQuery;
    }

  }
}