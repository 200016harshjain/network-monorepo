export class PeopleSearch {
  // build a list of people
    // get local contacts
    // get shared contacts via users and community
  // design caching and update of list of people
  // provide fast query layer
  // Alow providing context of community to query

  constructor(agent, peopleRepo) {
    this.agent = agent
    this.peopleRepo = peopleRepo
  }

  // params -> query, depth and root
  // query - string to match with, empty string to match all
  // depth - direct connections (1 degree) or shared connections via directs (2nd degree)
  // personUID - default root node or UID of direct connection
  async search({ query = "", depth = 1, personUID = null } = {}){
    const queryString = query.toLowerCase()
    let matches = []
    let dis = this

    if (depth > 2) { throw "Max supported depth is 2 due to community profile not being person type" }
    if (personUID && (depth != 1)) { throw "Max supported depth is 1 for a given root due to community profile not being person type" }

    async function peopleList(personUID) {
      if (personUID) {
        const rootPerson = await dis.peopleRepo.find(personUID)
        return await rootPerson.getMembers(dis.agent)
      }
      return await dis.peopleRepo.list();
    }

    async function searchRecursively(node, currentDepth) {
      if (dis.fullTextMatch(node, queryString) || dis.memberMatch(node, queryString)) {
        matches.push(node);
      }
  
      if (currentDepth >= depth) return;
      let connections = await node.getMembers(dis.agent)
      for (let connection of connections) {
        await searchRecursively(connection, currentDepth + 1);
      }
    }

    let people = await peopleList(personUID)
    for (let person of people) {
      await searchRecursively(person, 1);
    }

    return matches
  }

  //private
  fullTextMatch(person, query) {
    if ((person.FN && person.FN.toLowerCase().includes(query)) ||
        (person.NOTE && person.NOTE.toLowerCase().includes(query)) ||
        (person.URL && (person.URL.split(',').filter(link => link.toLowerCase().includes(query)).length > 0)) ||
        (person.CATEGORIES && person.CATEGORIES.split(',').filter(tag => tag.toLowerCase().includes(query)).length > 0)) {
      return true
    }

    if (person.EMAIL) {
      let emailMatch = false;
      if (Array.isArray(person.EMAIL)) {
        emailMatch = person.EMAIL.some(email => email.toLowerCase().includes(query));
      } else {   //done this way as some email's are strings while are some array of strings
        emailMatch =  person.EMAIL.split(',').filter(email => email.trim().toLowerCase().includes(query)).length > 0
      }
      if (emailMatch) {
        return true
      }
    }

    return false
  }

  memberMatch(person, query){
    if ((person.name && person.name.toLowerCase().includes(query)) ||
        (person.handle && person.handle.toLowerCase().includes(query)) ||
        (person.text && person.text.toLowerCase().includes(query))) {
      return true
    }

    let allTags = [].concat(person.lookingFor, person.canHelpWith, person.expertise).filter(t => t)
    if ((allTags.filter(tag => tag.toLowerCase().includes(query))).length > 0 ) {
      return true
    }
    
    return false
  }
}