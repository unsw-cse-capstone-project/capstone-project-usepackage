const MsgType = {
    /** P  -> N; Processor is initialised and can receive data */
    INIT:    101,
    /** P  -> N; Processor is ready to process */
    READY:   102,
    /** P <-  N; Processor should start, with given data */
    START:   103,
    /** P <-> N; Request/receipt of undo stack */
    STACK:   201,
    /** P  -> N; Current frame updated */
    POS:     202,
    /** P <-> N; Request/receipt of cut lengths */
    LENGTH:  203,
    /** P <-  N; Update playing status */
    PLAY:    301,
    /** P  -> N; Processing completed and stopped */
    STOP:    302,
    /** P <-  N; Seek to given time */
    SEEK:    303,
    /** P <-> N; Request/receipt of slider updates */
    UPDATE:  304,
    /** P <-  N; Cut at given time */
    CUT:     401,
    /** P <-  N; Set tempo of given slice */
    TEMPO:   402,
    /** P <-  N; Set gain of given slice and channel */
    GAIN:    403,
    /** P <-  N; Set pitch of given slice */
    PITCH:   404,
    /** P <-  N; Toggle crop of given slice */
    CROP:    405,
    /** P <-  N; Copy given slice to given index */
    COPY:    406,
    /** P <-  N; Move given slice to given index */
    MOVE:    407,
    /** P <-  N; Move cut by an offset */
    MOVECUT: 408,
    /** P <-  N; Undo last action */
    UNDO:    501,
    /** P <-  N; Redo last undone action */
    REDO:    502 
};

export default MsgType;