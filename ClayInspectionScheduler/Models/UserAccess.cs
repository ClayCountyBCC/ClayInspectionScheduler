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
    private const string mis_access_group = "gICT";
    public bool authenticated { get; set; } = false;
    public string user_name { get; set; }
    public int employee_id { get; set; } = 0;
    public string display_name { get; set; } = "";
    public enum access_type : int
    {
      no_access = 0, // denied access
      public_access = 1, // They get treated like public users.
      basic_access = 2,
      inspector_access = 3
    }
    public access_type current_access { get; set; } = access_type.public_access; // default to public access.

    public UserAccess(string name)
    {
      user_name = name;
      if(user_name.Length == 0)
      {
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
            new ErrorLog(ex);
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
          var groups = (from g in up.GetAuthorizationGroups()
                        select g.Name).ToList();
          if(groups.Contains(mis_access_group) | groups.Contains(inspector_access_group))
          {
            current_access = access_type.inspector_access;
          }
          else
          {
            if (groups.Contains(basic_access_group))
            {
              current_access = access_type.basic_access;
            }
          }
        }
      }
      catch (Exception ex)
      {
        new ErrorLog(ex);
      }
    }

    private static void ParseGroup(string group, ref Dictionary<string, UserAccess> d)
    {
      using (PrincipalContext pc = new PrincipalContext(ContextType.Domain))
      {
        using (GroupPrincipal gp = GroupPrincipal.FindByIdentity(pc, group))
        {
          if (gp != null)
          {
            foreach (UserPrincipal up in gp.GetMembers())
            {
              if (up != null)
              {
                d.Add(up.SamAccountName.ToLower(), new UserAccess(up));
              }
            }
          }
        }
      }
    }

    public static Dictionary<string, UserAccess> GetAllUserAccess()
    {
      var d = new Dictionary<string, UserAccess>();

      try
      {
        ParseGroup(basic_access_group, ref d);
        ParseGroup(inspector_access_group, ref d);
        ParseGroup(mis_access_group, ref d);
        d[""] = new UserAccess(""); // for the anonymous users
        return d;
      }
      catch (Exception ex)
      {
        new ErrorLog(ex);
        return null;
      }
    }

    public static UserAccess GetUserAccess(string Username)
    {
      try
      {
        var d = GetCachedAllUserAccess();
        string un = Username.Replace(@"CLAYBCC\", "").ToLower();
        if (d.ContainsKey(un))
        {
          return d[un]; // we're dun
        }
        else
        {
          return d[""];
        }
      }
      catch(Exception ex)
      {
        new ErrorLog(ex, "");
        return null;
      }
    }

    public static Dictionary<string, UserAccess> GetCachedAllUserAccess()
    {
      return (Dictionary<string, UserAccess>)MyCache.GetItem("useraccess");
    }

  }
}