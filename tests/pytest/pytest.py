

class test():
  a = 1

  def __init__(self):
    print('test constructor')

  def test(self, a1 = "test", a2 = "argument"):
      print('test' + str(self.a) + str(a1) + str(a2))
      return self.a, a1, a2

  def arrayTest(self, args):
    out = []
    for i in args:
      out.append(i)
    return out

  def exceptionTest(self):
    raise Exception('test exception')