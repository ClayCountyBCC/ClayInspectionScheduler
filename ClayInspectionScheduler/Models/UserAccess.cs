using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.DirectoryServices.AccountManagement;

namespace ClayInspectionScheduler.Models
{
  public class UserAccess
  {
    private const string basic_access_group = "gInspectionAppAccess"; // We may make this an argument if we end up using this code elsewhere.
    private const string inspector_access_group = "gInspectionAppInspectors";
    private const string mis_access_group = "gMISDeveloper_Group";
    private const string contract_inspection_access_group = "gUniversalEngineering";

    public bool authenticated { get; set; } = false;
    public string user_name { get; set; }
    public int employee_id { get; set; } = 0;
    public string display_name { get; set; } = "";

  public enum access_type : int
    {
      public_access = 1, // They get treated like public users.
      basic_access = 2,
      inspector_access = 3,
      contract_access = 4
    }
    public access_type current_access { get; set; } = access_type.public_access; // default to public access.

    public UserAccess(string name)
    {
      user_name = name;
      if(user_name.Length == 0)
      {
        user_name = "clayIns";
        display_name = "Public User";
      }
      else
      {
        display_name = name;
        using (PrincipalContext pc = new PrincipalContext(ContextType.Domain))
        {
          try
          {
            var up = UserPrincipal.FindByIdentity(pc, user_name);
            ParseUser(up);
          }
          catch (Exception ex)
          {
            Constants.Log(ex);
          }
        }
      }
    }

    public UserAccess(UserPrincipal up)
    {
      ParseUser(up);


    }

    private void ParseUser(UserPrincipal up)
    {
      try
      {
        if (up != null)
        {
          user_name = up.SamAccountName.ToLower();
          authenticated = true;
          display_name = up.DisplayName;

          if (int.TryParse(up.EmployeeId, out int eid))
          {
            employee_id = eid;
          }
          if (IsMember(user_name, mis_access_group))
          {
            current_access = access_type.inspector_access;
            return;
          }
          if (IsMember(user_name, inspector_access_group))
          {
            current_access = access_type.inspector_access;
            return;
          }
          if (IsMember(user_name, basic_access_group))
          {
            current_access = access_type.basic_access;
            return;
          }
          if (IsMember(user_name, contract_inspection_access_group))
          {
            current_access = access_type.contract_access;
            return;
          }



          //  if (int.TryParse(up.EmployeeId, out int eid))
          //  {
          //    employee_id = eid;
          //  }
          //  var groups = (from g in up.GetAuthorizationGroups()
          //                select g.Name).ToList();
          //  if (groups.Contains(mis_access_group) || groups.Contains(inspector_access_group))
          //  {
          //    current_access = access_type.inspector_access;
          //    return;
          //  }
          //  else
          //  {
          //    if (groups.Contains(basic_access_group))
          //    {
          //      current_access = access_type.basic_access;
          //      return;
          //    }
          //    if (groups.Contains(contract_inspection_access_group))
          //    {
          //      current_access = access_type.contract_access;
          //      return;
          //    }

          //}
        }
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
      }
    }

    //private static bool ParseGroup(string group, ref Dictionary<string, UserAccess> d)
    //{
    //  using (PrincipalContext pc = new PrincipalContext(ContextType.Domain))
    //  {
    //    using (GroupPrincipal gp = GroupPrincipal.FindByIdentity(pc, group))
    //    {
    //      if (gp != null)
    //      {
    //        foreach (UserPrincipal up in gp.GetMembers())
    //        {
    //          if (up != null)
    //          {
    //            if (!d.ContainsKey(up.SamAccountName.ToLower()))
    //            {
    //              d.Add(up.SamAccountName.ToLower(), new UserAccess(up));
    //              return true;
    //            }


    //          }
    //        }
    //      }

    //      return false;
    //    }
    //  }
    //}

    //public static Dictionary<string, UserAccess> GetAllUserAccess()
    //{
    //  var d = new Dictionary<string, UserAccess>();

    //  try
    //  {
    //    switch (Environment.MachineName.ToUpper())
    //    {

    //      case "CLAYBCCDMZIIS01":
    //        d[""] = new UserAccess("");
    //        break;
    //      default:
    //        ParseGroup(mis_access_group, ref d);
    //        ParseGroup(inspector_access_group, ref d);
    //        ParseGroup(basic_access_group, ref d);
    //        ParseGroup(contract_inspection_access_group, ref d);
    //        d[""] = new UserAccess("");
    //        break;

    //    }
    //      return d;
    //  }
    //  catch (Exception ex)
    //  {
    //    Constants.Log(ex);
    //    return null;
    //  }
    //}

    //public static UserAccess GetUserAccess(string Username)
    //{
    //  try
    //  {
    //    string un = Username.Replace(@"CLAYBCC\", "").ToLower();
    //    un = "universalengineering"; /* change "" to user_name you wish to test */
    //    switch (Environment.MachineName.ToUpper())
    //    {
    //      case "MISSL01":
    //      case "MISHL05":
    //      default:

    //        //var my_access = new UserAccess(un);
    //        //return my_access;

    //        var d = GetCachedAllUserAccess();

    //        if (d.ContainsKey(un))
    //        {
    //          return d[un]; // we're dun
    //        }
    //        else
    //        {
    //          return d[""];
    //        }
    //    }
    //  }
    //  catch(Exception ex)
    //  {
    //    Constants.Log(ex, "");
    //    return null;
    //  }
    //}

    //public static Dictionary<string, UserAccess> GetCachedAllUserAccess()
    //{
    //  return (Dictionary<string, UserAccess>)MyCache.GetItem("useraccess");
    //}

    public static bool IsMember(string UserName, string GroupName)
    {
      try
      {
        UserPrincipal user = UserPrincipal.FindByIdentity(
            new PrincipalContext(ContextType.Domain),
            UserName);

        foreach (Principal result in user.GetAuthorizationGroups())
        {
          if (string.Compare(result.Name, GroupName, true) == 0)
            return true;
        }
        return false;
      }
      catch (Exception E)
      {
        throw E;
      }
    }
  }
}