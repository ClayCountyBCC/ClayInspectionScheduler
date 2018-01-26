using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.DirectoryServices.AccountManagement;

namespace ClayInspectionScheduler.Models
{
  class UserAccess
  {
    private const string basic_access_group = "gInspectionAppAccess"; // We may make this an argument if we end up using this code elsewhere.
    public bool authenticated { get; set; } = false;
    public string user_name { get; set; }
    public int employee_id { get; set; } = 0;
    public string display_name { get; set; } = "";
    public enum access_type : int
    {
      no_access = 0, // denied access
      public_access = 1, // They get treated like public users.
      basic_access = 2
    }
    public access_type current_access { get; set; } = access_type.public_access; // default to public access.

    public UserAccess(string name)
    {
      user_name = name;
      display_name = name;
      if (name.Length > 0)
      {
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
          authenticated = true;
          display_name = up.DisplayName;
          if (int.TryParse(up.EmployeeId, out int eid))
          {
            employee_id = eid;
          }

          employee_id = int.Parse(up.EmployeeId);
          var groups = (from g in up.GetAuthorizationGroups()
                        select g.Name).ToList();
          if (groups.Contains(basic_access_group))
          {
            current_access = access_type.basic_access;
          }
        }
      }
      catch (Exception ex)
      {
        new ErrorLog(ex);
      }
    }

    public static Dictionary<string, UserAccess> GetAllUserAccess()
    {
      var d = new Dictionary<string, UserAccess>();

      try
      {
        using (PrincipalContext pc = new PrincipalContext(ContextType.Domain))
        {
          using (GroupPrincipal gp = GroupPrincipal.FindByIdentity(pc, basic_access_group))
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
        return d;
      }
      catch (Exception ex)
      {
        new ErrorLog(ex);
        return null;
      }
    }

  }
}